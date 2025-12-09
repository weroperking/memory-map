import { useState } from 'react';
import { Sparkles, Bot, User, AlertTriangle, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  reasons: string[];
  analysis: {
    noiseScore: number;
    edgeScore: number;
    textureScore: number;
    anatomyScore?: number;
    lightingScore: number;
    overallScore: number;
  };
  details: string;
}

interface AIDetectionPanelProps {
  imageUrl: string;
  imageName: string;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export function AIDetectionPanel({ imageUrl, imageName, isPro = true, onUpgrade }: AIDetectionPanelProps) {
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    if (!isPro && onUpgrade) {
      onUpgrade();
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert image URL to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const imageBase64 = await base64Promise;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('ai-detection', {
        body: { imageBase64, imageName }
      });

      if (error) {
        console.error('AI detection error:', error);
        toast.error('AI detection failed', { description: error.message });
        return;
      }

      if (data.error) {
        toast.error('AI detection error', { description: data.error });
        return;
      }

      setResult(data);
    } catch (error) {
      console.error('AI detection error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="border-t-2 border-foreground bg-secondary/50 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <p className="font-mono font-bold text-sm">Analyzing with AI...</p>
            <p className="text-xs text-muted-foreground">Using advanced vision models for forensic analysis</p>
          </div>
        </div>
        <Progress value={66} className="mt-3 h-2" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="border-t-2 border-foreground p-4 space-y-4">
        {/* Result Header */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
          result.isAIGenerated 
            ? 'border-destructive bg-destructive/10' 
            : 'border-chart-2 bg-chart-2/10'
        }`}>
          {result.isAIGenerated ? (
            <>
              <Bot className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-mono font-bold text-destructive">Likely AI Generated</p>
                <p className="text-sm text-muted-foreground">{result.confidence}% confidence</p>
              </div>
            </>
          ) : (
            <>
              <User className="h-6 w-6 text-chart-2" />
              <div>
                <p className="font-mono font-bold text-chart-2">Likely Authentic</p>
                <p className="text-sm text-muted-foreground">{result.confidence}% confidence</p>
              </div>
            </>
          )}
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Noise Pattern</span>
              <span>{result.analysis.noiseScore}%</span>
            </div>
            <Progress value={result.analysis.noiseScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Edge Analysis</span>
              <span>{result.analysis.edgeScore}%</span>
            </div>
            <Progress value={result.analysis.edgeScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Lighting</span>
              <span>{result.analysis.lightingScore}%</span>
            </div>
            <Progress value={result.analysis.lightingScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Texture</span>
              <span>{result.analysis.textureScore}%</span>
            </div>
            <Progress value={result.analysis.textureScore} className="h-2" />
          </div>
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase">Analysis Details</p>
          {result.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              {result.isAIGenerated ? (
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-4 w-4 text-chart-2 flex-shrink-0 mt-0.5" />
              )}
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Full details */}
        {result.details && (
          <div className="bg-secondary/50 rounded p-2 text-xs text-muted-foreground max-h-24 overflow-y-auto">
            {result.details}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          ⚠️ AI-powered analysis using advanced vision models. Results may not be 100% accurate.
        </p>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={runAnalysis}
          className="w-full border-2 border-foreground"
        >
          Re-analyze
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-foreground bg-chart-4/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4" />
        <span className="font-mono text-sm font-bold">AI DETECTION</span>
        {!isPro && (
          <span className="ml-auto flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
            <Lock className="h-3 w-3" />
            PRO
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Analyze this image for AI-generation using advanced vision AI forensics.
      </p>
      <Button
        onClick={runAnalysis}
        className="w-full gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground"
      >
        {!isPro && <Lock className="h-4 w-4" />}
        <Sparkles className="h-4 w-4" />
        {isPro ? 'Run AI Detection' : 'Unlock AI Detection'}
      </Button>
    </div>
  );
}
