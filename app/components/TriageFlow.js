export default function TriageFlow() {
  const Envelope = ({ stroke, fill }) => (
    <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
      <rect x="1" y="1" width="32" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <path d="M3 4 L17 14 L31 4" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );

  return (
    <div className="relative w-full max-w-md mx-auto" aria-hidden="true">
      {/* Inbox source */}
      <div className="flex justify-center mb-2">
        <div className="text-xs font-medium text-inkFaint uppercase tracking-wide border border-black/10 rounded-full px-4 py-1.5 bg-surface">
          Inbox
        </div>
      </div>

      {/* Flowing chips */}
      <div className="relative h-[190px]">
        <div className="chip anim-flow-left" style={{ animationDelay: "0s" }}>
          <Envelope stroke="#D97757" fill="#F3E3DA" />
        </div>
        <div className="chip anim-flow-center" style={{ animationDelay: "0.6s" }}>
          <Envelope stroke="#5A7A3E" fill="#EAEFE6" />
        </div>
        <div className="chip anim-flow-right" style={{ animationDelay: "1.2s" }}>
          <Envelope stroke="#9B9A91" fill="#EFEBE0" />
        </div>
        <div className="chip anim-flow-left" style={{ animationDelay: "1.8s" }}>
          <Envelope stroke="#5A7A3E" fill="#EAEFE6" />
        </div>
        <div className="chip anim-flow-center" style={{ animationDelay: "2.4s" }}>
          <Envelope stroke="#D97757" fill="#F3E3DA" />
        </div>
        <div className="chip anim-flow-left" style={{ animationDelay: "3s" }}>
          <Envelope stroke="#9B9A91" fill="#EFEBE0" />
        </div>
        <div className="chip anim-flow-right" style={{ animationDelay: "3.4s" }}>
          <Envelope stroke="#5A7A3E" fill="#EAEFE6" />
        </div>
      </div>

      {/* Trays */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-clay/30 bg-clayTint px-3 py-3 text-center">
          <div className="text-xs font-medium text-clayDark">Urgent</div>
        </div>
        <div className="rounded-xl border border-routine/30 bg-[#EAEFE6] px-3 py-3 text-center">
          <div className="text-xs font-medium text-routine">Routine</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-bgAlt px-3 py-3 text-center">
          <div className="text-xs font-medium text-inkDim">Noise</div>
        </div>
      </div>
    </div>
  );
}
