import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Brain, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

export default function AITranscription() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Meeting Transcription</h1>
            <p className="text-muted-foreground">
              Transform meeting recordings into actionable insights with AI-powered analysis
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Mic className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Auto Transcription</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">OpenAI Whisper integration</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300">Task Extraction</h3>
                <p className="text-xs text-green-600 dark:text-green-400">Smart task identification</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-700 dark:text-orange-300">Timeline Parsing</h3>
                <p className="text-xs text-orange-600 dark:text-orange-400">Automatic deadline detection</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="font-semibold text-purple-700 dark:text-purple-300">Action Items</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">Auto-generated follow-ups</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it Works Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            How AI Transcription Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="font-semibold">Paste Transcript</h3>
              <p className="text-sm text-muted-foreground">
                Copy and paste your meeting transcript from any source - recorded audio, live notes, or typed conversations.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                GPT-4 analyzes the conversation to extract tasks, identify team members, parse timelines, and detect blockers.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="font-semibold">Actionable Results</h3>
              <p className="text-sm text-muted-foreground">
                Get structured task lists, timeline summaries, and action items that integrate directly with your project management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Gets Extracted Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>What Gets Extracted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Per Team Member
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16 justify-center">Task</Badge>
                  What they're actively working on
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16 justify-center">Timeline</Badge>
                  Start dates and expected completion
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16 justify-center">Status</Badge>
                  Progress percentage or phase
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16 justify-center">Blocker</Badge>
                  Any mentioned obstacles
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Smart Processing
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Converts relative dates ("by Friday") to absolute dates</li>
                <li>• Identifies overdue and upcoming deadlines</li>
                <li>• Standardizes task descriptions and progress</li>
                <li>• Links tasks to projects when mentioned</li>
                <li>• Flags vague timelines for clarification</li>
                <li>• Creates HTML summaries for easy sharing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Transcript Processor */}
      <TranscriptProcessor />
    </div>
  );
}