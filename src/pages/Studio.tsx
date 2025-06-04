
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  PenTool, 
  BookOpen, 
  Save, 
  Share, 
  Heart,
  Trash2,
  Plus,
  LogOut,
  FileText,
  Lightbulb,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { geminiService, type GenerationOptions } from '@/services/geminiService';
import type { User, Session } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CreativeWork {
  id: string;
  title: string;
  content: string;
  type: 'story' | 'poem' | 'script' | 'article';
  prompt?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
}

const Studio = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWork, setCurrentWork] = useState<Partial<CreativeWork>>({
    title: '',
    content: '',
    type: 'story',
    prompt: '',
    is_public: false
  });
  const [activeTab, setActiveTab] = useState('create');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadWorks();
      loadPrompts();
    }
  }, [user]);

  const loadWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('creative_works')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Error loading works:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your works',
        variant: 'destructive',
      });
    }
  };

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('writing_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const generateContent = async () => {
    if (!currentWork.prompt?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt to generate content.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const options: GenerationOptions = {
        prompt: currentWork.prompt,
        type: currentWork.type as any || 'story',
        tone: 'creative',
        length: 'medium'
      };

      const content = await geminiService.generateContent(options);
      setCurrentWork(prev => ({ ...prev, content }));
      
      toast({
        title: 'Content generated!',
        description: 'Your AI-generated content is ready.',
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWork = async () => {
    if (!currentWork.title?.trim() || !currentWork.content?.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both title and content.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const workData = {
        title: currentWork.title,
        content: currentWork.content,
        type: currentWork.type || 'story',
        prompt: currentWork.prompt || null,
        is_public: currentWork.is_public || false,
        user_id: user?.id
      };

      const { error } = await supabase
        .from('creative_works')
        .insert([workData]);

      if (error) throw error;

      toast({
        title: 'Work saved!',
        description: 'Your creative work has been saved successfully.',
      });

      // Reset form
      setCurrentWork({
        title: '',
        content: '',
        type: 'story',
        prompt: '',
        is_public: false
      });

      // Reload works
      loadWorks();
    } catch (error) {
      console.error('Error saving work:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your work. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteWork = async (id: string) => {
    try {
      const { error } = await supabase
        .from('creative_works')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Work deleted',
        description: 'Your creative work has been deleted.',
      });

      loadWorks();
    } catch (error) {
      console.error('Error deleting work:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the work.',
        variant: 'destructive',
      });
    }
  };

  const savePrompt = async (title: string, prompt: string, category: string) => {
    try {
      const { error } = await supabase
        .from('writing_prompts')
        .insert([{
          title,
          prompt,
          category,
          user_id: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Prompt saved!',
        description: 'Your writing prompt has been saved.',
      });

      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the prompt.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">GenWrite</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 hidden sm:flex">
              <User className="w-3 h-3 mr-1" />
              {user?.email}
            </Badge>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          <TabsList className="bg-white/5 border border-white/10 w-full sm:w-auto overflow-x-auto overflow-hidden">
            <TabsTrigger value="create" className="text-white data-[state=active]:bg-white/10">
              <PenTool className="w-4 h-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="library" className="text-white data-[state=active]:bg-white/10">
              <BookOpen className="w-4 h-4 mr-2" />
              My Works
            </TabsTrigger>
            <TabsTrigger value="prompts" className="text-white data-[state=active]:bg-white/10">
              <Lightbulb className="w-4 h-4 mr-2" />
              Writing Prompts
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="glass-effect bg- border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-emerald-400" />
                  Create New Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      value={currentWork.title}
                      onChange={(e) => setCurrentWork(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your work title"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Type</Label>
                    <Select 
                      value={currentWork.type} 
                      onValueChange={(value) => setCurrentWork(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger id="type" className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="poem">Poem</SelectItem>
                        <SelectItem value="script">Script</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={currentWork.prompt}
                    onChange={(e) => setCurrentWork(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe what you want the AI to create..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[100px]"
                  />
                  <Button
                    onClick={generateContent}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 w-full sm:w-auto"
                  >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white">Content</Label>
                  <Textarea
                    id="content"
                    value={currentWork.content}
                    onChange={(e) => setCurrentWork(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Start writing or generate content with AI..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[300px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public"
                      checked={currentWork.is_public}
                      onChange={(e) => setCurrentWork(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <Label htmlFor="public" className="text-white">Make public</Label>
                  </div>
                  <Button
                    onClick={saveWork}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Work
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Works</h2>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                {works.length} works
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {works.map((work) => (
                // Inside the works.map() section, replace the existing Card with:
                // In your Card onClick handler, replace the openWork function with:
                <Card 
                  key={work.id} 
                  className="glass-effect border-white/10 bg-primary/20 hover:border-emerald-500/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/work/${work.id}`)}
                >
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
                        {work.type}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {work.is_public && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                            <Share className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              aria-label="Delete work"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Work</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "{work.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white/10 text-white hover:bg-white/20"
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteWork(work.id);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardTitle className="text-white text-lg mt-2">{work.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                      {work.content.substring(0, 150)}...
                    </p>
                    <div className="text-xs text-gray-400">
                      Updated {new Date(work.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {works.length === 0 && (
              <Card className="glass-effect border-white/10 bg- text-center py-8 sm:py-12">
                <CardContent>
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No works yet</h3>
                  <p className="text-gray-400 mb-4">Start creating your first piece with AI assistance</p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Work
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Writing Prompts</h2>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                {prompts.length} prompts
              </Badge>
            </div>

            <Card className="glass-effect bg- border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Save New Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-title" className="text-white">Title</Label>
                    <Input
                      id="prompt-title"
                      placeholder="Prompt title"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prompt-category" className="text-white">Category</Label>
                    <Input
                      id="prompt-category"
                      placeholder="Category"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-text" className="text-white">Prompt</Label>
                  <Textarea
                    id="prompt-text"
                    placeholder="Enter your writing prompt..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={() => {
                    const title = (document.getElementById('prompt-title') as HTMLInputElement)?.value;
                    const category = (document.getElementById('prompt-category') as HTMLInputElement)?.value;
                    const prompt = (document.getElementById('prompt-text') as HTMLTextAreaElement)?.value;
                    
                    if (title && category && prompt) {
                      savePrompt(title, prompt, category);
                      // Clear form
                      (document.getElementById('prompt-title') as HTMLInputElement).value = '';
                      (document.getElementById('prompt-category') as HTMLInputElement).value = '';
                      (document.getElementById('prompt-text') as HTMLTextAreaElement).value = '';
                    } else {
                      toast({
                        title: 'Error',
                        description: 'Please fill in all fields',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Prompt
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="glass-effect bg-primary/20 border-white/10 hover:border-emerald-500/50 transition-colors">
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
                        {prompt.category}
                      </Badge>
                      {prompt.is_favorite && (
                        <Heart className="w-4 h-4 text-red-400" fill="currentColor" />
                      )}
                    </div>
                    <CardTitle className="text-white text-lg mt-2">{prompt.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">{prompt.prompt}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCurrentWork(prev => ({ ...prev, prompt: prompt.prompt }));
                          setActiveTab('create');
                          toast({
                            title: 'Prompt selected',
                            description: 'Prompt added to the create tab',
                          });
                        }}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Use Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {prompts.length === 0 && (
              <Card className="glass-effect bg- border-white/10 text-center py-8 sm:py-12">
                <CardContent>
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No prompts yet</h3>
                  <p className="text-gray-400 mb-4">Save your favorite writing prompts for later use</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Studio;
