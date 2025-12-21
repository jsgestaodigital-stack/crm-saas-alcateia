import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTENTIQUE_API = 'https://api.autentique.com.br/v2/graphql';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const autentiqueToken = Deno.env.get('AUTENTIQUE_TOKEN');

    if (!autentiqueToken) {
      return new Response(JSON.stringify({ 
        error: 'Autentique não configurado',
        message: 'O token do Autentique não está configurado. Use o modo manual para gerar o contrato.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contractId } = await req.json();

    if (!contractId) {
      return new Response(JSON.stringify({ error: 'contractId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[send-to-autentique] Processing contract: ${contractId}`);

    // Fetch contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('[send-to-autentique] Contract not found:', contractError);
      return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate contract status
    if (contract.status !== 'draft') {
      return new Response(JSON.stringify({ 
        error: 'Apenas contratos em rascunho podem ser enviados para assinatura'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required emails
    if (!contract.contracted_email || !contract.contractor_email) {
      return new Response(JSON.stringify({ 
        error: 'E-mails do contratante e contratada são obrigatórios para envio via Autentique'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML content from contract
    const htmlContent = generateContractHtml(contract);

    // Create document in Autentique
    const createDocumentMutation = `
      mutation CreateDocument($document: DocumentInput!) {
        createDocument(document: $document) {
          id
          name
          signatures {
            public_id
            link
            user {
              email
              name
            }
          }
        }
      }
    `;

    const documentInput = {
      name: contract.title,
      content: {
        type: 'text/html',
        text: htmlContent
      },
      signers: [
        {
          email: contract.contracted_email,
          action: 'SIGN',
          name: contract.contracted_name || contract.contracted_responsible || 'Contratante'
        },
        {
          email: contract.contractor_email,
          action: 'SIGN', 
          name: contract.contractor_name || contract.contractor_responsible || 'Contratada'
        }
      ]
    };

    console.log('[send-to-autentique] Sending to Autentique API...');

    const autentiqueResponse = await fetch(AUTENTIQUE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${autentiqueToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: createDocumentMutation,
        variables: { document: documentInput }
      })
    });

    const autentiqueData = await autentiqueResponse.json();

    if (autentiqueData.errors) {
      console.error('[send-to-autentique] Autentique errors:', autentiqueData.errors);
      return new Response(JSON.stringify({ 
        error: 'Erro ao enviar para Autentique',
        details: autentiqueData.errors
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const createdDoc = autentiqueData.data?.createDocument;
    if (!createdDoc) {
      console.error('[send-to-autentique] No document created');
      return new Response(JSON.stringify({ error: 'Documento não foi criado no Autentique' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[send-to-autentique] Document created:', createdDoc.id);

    // Get first signer link for client
    const clientSignLink = createdDoc.signatures?.[0]?.link || null;

    // Update contract with Autentique data
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        autentique_document_id: createdDoc.id,
        autentique_sign_url: clientSignLink,
        autentique_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('[send-to-autentique] Update error:', updateError);
    }

    // Log event
    await supabase.from('contract_events').insert({
      contract_id: contractId,
      event_type: 'autentique.sent',
      payload: { document_id: createdDoc.id, signatures: createdDoc.signatures }
    });

    console.log('[send-to-autentique] Success!');

    return new Response(JSON.stringify({ 
      success: true,
      documentId: createdDoc.id,
      signUrl: clientSignLink
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[send-to-autentique] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateContractHtml(contract: any): string {
  const variables = contract.variables || {};
  const clauses = contract.clauses || [];

  // Build variable values from contract data
  const varValues: Record<string, string> = {
    ...variables,
    agencia_nome: contract.contractor_name || '',
    agencia_cnpj: contract.contractor_cnpj || '',
    agencia_endereco: contract.contractor_address || '',
    agencia_responsavel: contract.contractor_responsible || '',
    nome_empresa: contract.contracted_name || '',
    cnpj: contract.contracted_cnpj || '',
    cpf: contract.contracted_cpf || '',
    email: contract.contracted_email || '',
    endereco: contract.contracted_address || '',
    responsavel: contract.contracted_responsible || '',
    telefone: contract.contracted_phone || '',
    valor: contract.full_price ? `R$ ${contract.full_price.toLocaleString('pt-BR')}` : '',
    parcelas: contract.installments?.toString() || '1',
    valor_parcela: contract.installment_value ? `R$ ${contract.installment_value.toLocaleString('pt-BR')}` : '',
    prazo_execucao: contract.execution_term_days?.toString() || '30',
    data: new Date().toLocaleDateString('pt-BR'),
    cidade: variables.cidade || ''
  };

  // Replace variables in content
  const replaceVars = (text: string) => {
    let result = text;
    Object.entries(varValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, value || '');
    });
    return result;
  };

  // Build HTML
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 30px; }
    h2 { font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    p { text-align: justify; margin: 10px 0; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
    .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
    strong { font-weight: bold; }
  </style>
</head>
<body>
  <h1>${replaceVars(contract.title)}</h1>
`;

  // Add clauses
  clauses
    .filter((c: any) => !c.isHidden)
    .sort((a: any, b: any) => a.order - b.order)
    .forEach((clause: any) => {
      const content = replaceVars(clause.content)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '</p><ul><li>')
        .replace(/\n/g, '</p><p>');
      
      html += `
  <h2>${clause.order}. ${clause.title}</h2>
  <p>${content}</p>
`;
    });

  html += `
</body>
</html>`;

  return html;
}
