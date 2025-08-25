import { Button } from "@/components/ui/button";

type TargetSize = 'small' | 'medium' | 'large';

interface TargetSizeSelectorProps {
  selectedSize: TargetSize;
  onSizeChange: (size: TargetSize) => void;
}

const TargetSizeSelector = ({ selectedSize, onSizeChange }: TargetSizeSelectorProps) => {
  const sizes: { id: TargetSize; label: string }[] = [
    { id: 'small', label: 'S' },
    { id: 'medium', label: 'M' },
    { id: 'large', label: 'L' },
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
              flex-1 flex items-center justify-center py-3 h-auto
              ${selectedSize === size.id 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-white/90 border-white/20 hover:bg-white'
              }
            `}
          >
            <span className="text-lg font-bold">{size.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TargetSizeSelector;