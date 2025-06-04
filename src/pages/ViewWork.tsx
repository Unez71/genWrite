import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const ViewWork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = React.useState<CreativeWork | null>(null);

  React.useEffect(() => {
    const fetchWork = async () => {
      const { data, error } = await supabase
        .from('creative_works')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching work:', error);
        navigate('/studio');
        return;
      }

      setWork(data);
    };

    fetchWork();
  }, [id, navigate]);

  if (!work) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Button
          onClick={() => navigate('/studio')}
          variant="ghost"
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Studio
        </Button>

        <Card className="glass-effect bg- border-white/10">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
                {work.type}
              </Badge>
              {work.is_public && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                  <Share className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            <CardTitle className="text-white text-2xl mt-2">{work.title}</CardTitle>
            <div className="text-sm text-gray-400 mt-2">
              Last updated: {new Date(work.updated_at).toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            {/* {work.prompt && (
              <div className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-emerald-400 mb-2">Prompt</h3>
                <p className="text-gray-300">{work.prompt}</p>
              </div>
            )} */}
            <div className="whitespace-pre-wrap text-gray-200">{work.content}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewWork;