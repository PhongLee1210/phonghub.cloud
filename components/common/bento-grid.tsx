import { Card } from "@/components/ui/card";
import Image from "next/image";

interface BentoGridProps {
  images: string[];
  className?: string;
}

export function BentoGrid({ images, className = "" }: BentoGridProps) {
  if (!images || images.length === 0) return null;

  // Define different grid layouts based on number of images
  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
      case 5:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  const getImageSize = (index: number, total: number) => {
    // Create varied sizes for bento grid effect
    if (total === 1) return "col-span-1 row-span-1";
    if (total === 2) return "col-span-1 row-span-1";
    if (total === 3) {
      if (index === 0) return "col-span-1 md:col-span-2 row-span-1";
      return "col-span-1 row-span-1";
    }
    if (total === 4) {
      if (index === 0)
        return "col-span-1 md:col-span-2 row-span-1 md:row-span-2";
      if (index === 1) return "col-span-1 row-span-1";
      if (index === 2) return "col-span-1 row-span-1";
      return "col-span-1 md:col-span-2 row-span-1";
    }
    if (total === 5) {
      if (index === 0)
        return "col-span-1 md:col-span-2 row-span-1 md:row-span-2";
      if (index === 1) return "col-span-1 row-span-1";
      if (index === 2) return "col-span-1 md:col-span-2 row-span-1";
      return "col-span-1 row-span-1";
    }

    // Default for more than 5 images
    if (index === 0) return "col-span-1 md:col-span-2 row-span-1 md:row-span-2";
    if (index === 1 || index === 2) return "col-span-1 row-span-1";
    return "col-span-1 md:col-span-2 row-span-1";
  };

  return (
    <div className={`grid gap-4 ${getGridLayout(images.length)} ${className}`}>
      {images.map((image, index) => (
        <Card
          key={index}
          className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${getImageSize(
            index,
            images.length
          )}`}
        >
          <div className="relative aspect-square md:aspect-auto md:h-48 lg:h-64">
            <Image
              src={image}
              alt={`Experience image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Card>
      ))}
    </div>
  );
}
