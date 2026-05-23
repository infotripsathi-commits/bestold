interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  height?: number;
}

export default function Logo({ 
  className = '', 
  iconClassName = 'h-6 w-6',
  textClassName = 'text-xl font-bold',
  showText = true,
  height = 32
}: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src="https://miaoda-conversation-file.s3cdn.medo.dev/user-ahn8coto2kg0/conv-ahn8efyun8cg/20260406/file-ardc687x9hxc.png"
        alt="BestOld Logo"
        className={iconClassName}
        style={{ height: `${height}px`, width: 'auto' }}
        data-href="/" />
      {showText && (
        <span className="sr-only">{textClassName}</span>
      )}
    </div>
  );
}
