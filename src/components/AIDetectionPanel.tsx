import { useState } from 'react';
import { Sparkles, Bot, User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { detectAIGenerated, AIDetectionResult } from '@/lib/ai-detection';

interface AIDetectionPanelProps {
  imageUrl: string;
  imageName: string;
}

export function AIDetectionPanel({ imageUrl, imageName }: AIDetectionPanelProps) {
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const detection = await detectAIGenerated(imageUrl);
      setResult(detection);
    } catch (error) {
      console.error('AI detection error:', error);
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
            <p className="font-mono font-bold text-sm">Analyzing Image...</p>
            <p className="text-xs text-muted-foreground">Checking for AI generation patterns</p>
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
              <span>{result.noiseScore}%</span>
            </div>
            <Progress value={result.noiseScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Edge Analysis</span>
              <span>{result.edgeScore}%</span>
            </div>
            <Progress value={result.edgeScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Color Patterns</span>
              <span>{result.colorConsistencyScore}%</span>
            </div>
            <Progress value={result.colorConsistencyScore} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>Texture Analysis</span>
              <span>{result.textureScore}%</span>
            </div>
            <Progress value={result.textureScore} className="h-2" />
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

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          ⚠️ This analysis uses heuristic methods and may not be 100% accurate. 
          Advanced AI generators can evade detection.
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
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Analyze this image for AI-generation artifacts using noise pattern analysis.
      </p>
      <Button
        onClick={runAnalysis}
        className="w-full gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground"
      >
        <Sparkles className="h-4 w-4" />
        Run AI Detection
      </Button>
    </div>
  );
}
