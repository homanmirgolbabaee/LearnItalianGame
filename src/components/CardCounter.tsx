
import React from "react";

interface CardCounterProps {
  currentIndex: number;
  totalCards: number;
}

const CardCounter: React.FC<CardCounterProps> = ({ currentIndex, totalCards }) => {
  return (
    <div className="text-center text-sm font-medium text-gray-600 mb-2">
      Card {currentIndex + 1} of {totalCards}
    </div>
  );
};

export default CardCounter;
