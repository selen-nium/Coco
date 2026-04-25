// TODO (Agent 3): load agent_config, render voice selector, sliders, metaphor toggle, test chatbox
export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agent Configuration</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Voice Profile</p>
          <div className="h-10 bg-gray-100 rounded animate-pulse w-64" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">TTS Speed</p>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-48" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Repetition Level</p>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-48" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-10 bg-gray-100 rounded-full animate-pulse" />
          <p className="text-sm">Metaphor Teaching Mode</p>
        </div>

        {/* Live test box */}
        <div>
          <p className="text-sm font-medium mb-2">Test Voice</p>
          <div className="h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Type a prompt → hear the configured voice — Agent 3 implements
          </div>
        </div>
      </div>
    </div>
  );
}
