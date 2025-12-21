import { useState } from "react";
import { useSuggestions, Suggestion } from "@/hooks/useSuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Lightbulb, 
  Send, 
  Inbox, 
  Archive, 
  Check, 
  Clock, 
  ChevronLeft,
  User,
  Calendar,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Suggestions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    sentSuggestions,
    receivedSuggestions,
    isLoading,
    createSuggestion,
    isCreating,
    markAsRead,
    archive,
    newCount,
    userRole,
    canReceiveSuggestions,
  } = useSuggestions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    createSuggestion(
      { title: title.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
        },
      }
    );
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    if (suggestion.status === 'new' && canReceiveSuggestions) {
      markAsRead(suggestion.id);
    }
  };

  const getStatusBadge = (status: Suggestion['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">Nova</Badge>;
      case 'read':
        return <Badge variant="secondary">Lida</Badge>;
      case 'archived':
        return <Badge variant="outline">Arquivada</Badge>;
    }
  };

  const getTargetLabel = () => {
    if (userRole === 'admin') return "Super Admin";
    return "Admin";
  };

  const renderSuggestionCard = (suggestion: Suggestion, showAuthor = false) => (
    <div
      key={suggestion.id}
      onClick={() => handleSelectSuggestion(suggestion)}
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
        suggestion.status === 'new' && "bg-blue-500/5 border-blue-500/30",
        selectedSuggestion?.id === suggestion.id && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge(suggestion.status)}
            <span className="text-xs text-muted-foreground">
              {format(new Date(suggestion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <h4 className="font-medium truncate">{suggestion.title}</h4>
          {showAuthor && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />
              {suggestion.author_name}
            </p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {suggestion.description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-500" />
              Mural de Sugestões
            </h1>
            <p className="text-muted-foreground">
              Envie sugestões de melhoria do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form + Sent */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Suggestion Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Nova Sugestão
                </CardTitle>
                <CardDescription>
                  Sua sugestão será enviada para o {getTargetLabel()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Título da sugestão"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Descreva sua sugestão de melhoria..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {description.length}/2000
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isCreating || !title.trim() || !description.trim()}
                  >
                    {isCreating ? "Enviando..." : "Enviar Sugestão"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sent Suggestions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Minhas Sugestões
                  {sentSuggestions.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {sentSuggestions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-3">
                    {sentSuggestions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Você ainda não enviou sugestões
                      </p>
                    ) : (
                      sentSuggestions.map(s => renderSuggestionCard(s))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Received (only for admins) */}
          <div className="lg:col-span-2">
            {canReceiveSuggestions ? (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Sugestões Recebidas
                    {newCount > 0 && (
                      <Badge className="bg-blue-500 ml-2">
                        {newCount} nova{newCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Sugestões enviadas pela sua equipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="all" className="w-full">
                    <div className="px-4">
                      <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">
                          Todas ({receivedSuggestions.length})
                        </TabsTrigger>
                        <TabsTrigger value="new" className="flex-1">
                          Novas ({receivedSuggestions.filter(s => s.status === 'new').length})
                        </TabsTrigger>
                        <TabsTrigger value="archived" className="flex-1">
                          Arquivadas
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="all" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* List */}
                        <ScrollArea className="h-[500px] border-r">
                          <div className="p-4 space-y-3">
                            {receivedSuggestions.filter(s => s.status !== 'archived').length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">
                                Nenhuma sugestão recebida
                              </p>
                            ) : (
                              receivedSuggestions
                                .filter(s => s.status !== 'archived')
                                .map(s => renderSuggestionCard(s, true))
                            )}
                          </div>
                        </ScrollArea>

                        {/* Detail */}
                        <div className="p-4">
                          {selectedSuggestion ? (
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  {getStatusBadge(selectedSuggestion.status)}
                                  <h3 className="text-lg font-semibold mt-2">
                                    {selectedSuggestion.title}
                                  </h3>
                                </div>
                                {selectedSuggestion.status !== 'archived' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => archive(selectedSuggestion.id)}
                                  >
                                    <Archive className="h-4 w-4 mr-1" />
                                    Arquivar
                                  </Button>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {selectedSuggestion.author_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(selectedSuggestion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>

                              <div className="bg-muted/50 rounded-lg p-4">
                                <p className="whitespace-pre-wrap">
                                  {selectedSuggestion.description}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                              <p>Selecione uma sugestão para ver os detalhes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="new" className="mt-0">
                      <ScrollArea className="h-[500px]">
                        <div className="p-4 space-y-3">
                          {receivedSuggestions.filter(s => s.status === 'new').length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhuma sugestão nova
                            </p>
                          ) : (
                            receivedSuggestions
                              .filter(s => s.status === 'new')
                              .map(s => renderSuggestionCard(s, true))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="archived" className="mt-0">
                      <ScrollArea className="h-[500px]">
                        <div className="p-4 space-y-3">
                          {receivedSuggestions.filter(s => s.status === 'archived').length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhuma sugestão arquivada
                            </p>
                          ) : (
                            receivedSuggestions
                              .filter(s => s.status === 'archived')
                              .map(s => renderSuggestionCard(s, true))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <Lightbulb className="h-16 w-16 text-amber-500/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Contribua com suas ideias!</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Use o formulário ao lado para enviar sugestões de melhoria. 
                    Suas ideias serão analisadas pelo Admin responsável.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
