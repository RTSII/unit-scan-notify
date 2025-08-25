import { Button } from "@/components/ui/button";

type TargetSize = 'small' | 'medium' | 'large';

interface TargetSizeSelectorProps {
  selectedSize: TargetSize;
  onSizeChange: (size: TargetSize) => void;
}

const TargetSizeSelector = ({ selectedSize, onSizeChange }: TargetSizeSelectorProps) => {
  const sizes: { id: TargetSize; label: string; description: string }[] = [
    { id: 'small', label: 'S', description: 'Minor violations' },
    { id: 'medium', label: 'M', description: 'Standard violations' },
    { id: 'large', label: 'L', description: 'Major violations' },
  ];

  return (
    <div className="camera-controls">
      <div className="text-sm font-medium text-foreground mb-3">Target Size</div>
      <div className="flex gap-2">
        {sizes.map((size) => (
          <Button
            key={size.id}
            variant={selectedSize === size.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSizeChange(size.id)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 h-auto
              ${selectedSize === size.id 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-white/90 border-white/20 hover:bg-white'
              }
            `}
          >
            <span className="text-lg font-bold">{size.label}</span>
            <span className="text-xs opacity-80">{size.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TargetSizeSelector;