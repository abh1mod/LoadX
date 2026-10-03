import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({
  rating = 0,
  maxRating = 5,
  size = 'md',
  onChange = null,
  showValue = false
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const starSize = sizeMap[size] || sizeMap.md;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= Math.round(rating);

        return (
          <button
            key={index}
            type="button"
            disabled={!onChange}
            onClick={() => onChange && onChange(starValue)}
            className={`transition-colors focus:outline-none ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            <Star
              className={`${starSize} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 stroke-1'
              }`}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-xs font-semibold text-slate-700">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
