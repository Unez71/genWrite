
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  PenTool, 
  BookOpen, 
  Film, 
  FileText, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Download,
  Settings,
  User,
  LogOut,
  Lightbulb
} from 'lucide-react';
import { geminiService, GenerationOptions } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Studio = () => {
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<GenerationOptions['type']>('story');
  const [tone, setTone] = useState<GenerationOptions['tone']>('creative');
  const [length, setLength] = useState<GenerationOptions['length']>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const contentTypes = [
    { value: 'story', label: 'Story', icon: BookOpen },
    { value: 'poem', label: 'Poem', icon: PenTool },
    { value: 'script', label: 'Script', icon: Film },
    { value: 'article', label: 'Article', icon: FileText },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Tell me what you'd like to create!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await geminiService.generateContent({
        prompt,
        type: contentType,
        tone,
        length
      });
      setContent(result);
      toast({
        title: "Content generated!",
        description: "Your creative content has been generated successfully."
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again with a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to improve",
        description: "Generate some content first!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await geminiService.improveContent(content, "Make this more engaging and creative");
      setContent(result);
      toast({
        title: "Content improved!",
        description: "Your content has been enhanced."
      });
    } catch (error) {
      toast({
        title: "Improvement failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSuggestions = async () => {
    if (!content.trim()) return;
    
    try {
      const newSuggestions = await geminiService.getSuggestions(content, contentType);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setContent(content + '\n\n' + suggestion);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">CreativeAI Studio</h1>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Content Type Selection */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PenTool className="w-5 h-5 mr-2" />
                  Create New
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={contentType === type.value ? "default" : "outline"}
                        className={`flex flex-col items-center space-y-2 h-auto py-4 ${
                          contentType === type.value 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                            : 'border-white/20 text-white hover:bg-white/10'
                        }`}
                        onClick={() => setContentType(type.value as GenerationOptions['type'])}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Tone</label>
                    <Select value={tone} onValueChange={(value) => setTone(value as GenerationOptions['tone'])}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="mysterious">Mysterious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Length</label>
                    <Select value={length} onValueChange={(value) => setLength(value as GenerationOptions['length'])}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-300 text-sm mb-2">{suggestion}</p>
                      <Button
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Describe what you want to create... (e.g., 'A mysterious story about a lighthouse keeper who discovers something strange in the ocean')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[100px] resize-none focus:border-purple-500"
                  />
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    {content && (
                      <Button
                        onClick={getSuggestions}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Get Ideas
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Your Creation
                    {contentType && <Badge variant="secondary" className="ml-2 capitalize">{contentType}</Badge>}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {content && (
                      <>
                        <Button
                          onClick={handleImprove}
                          disabled={isGenerating}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Improve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {content ? (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-[400px] resize-none focus:border-purple-500"
                    placeholder="Your AI-generated content will appear here..."
                  />
                ) : (
                  <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-white/10 rounded-lg">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 text-lg mb-2">Ready to create something amazing?</p>
                      <p className="text-gray-400">Enter a prompt above to get started with AI-powered writing.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
