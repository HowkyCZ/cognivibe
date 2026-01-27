"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";

const categories = [
  // Column 1
  "Communication",
  "Meetings",
  "Docs and Writing",
  "Productivity and Planning",
  "Browsing and Research",
  // Column 2
  "Development",
  "Design and Creative",
  "Data and Analytics",
  "Media and Entertainment",
  "Other",
];

const ProductivityTimeCard = () => {
  const column1 = categories.slice(0, 5);
  const column2 = categories.slice(5, 10);

  return (
    <Card className="w-full h-full bg-content1 border border-white/10 hover:border-white/15 transition-colors">
      <CardBody className="p-6">
        <h2 className="text-2xl font-semibold text-foreground text-left mb-6">
          Productivity time
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            {column1.map((category) => (
              <div
                key={category}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-foreground">{category}</span>
                <span className="text-sm text-foreground/60">00:00</span>
              </div>
            ))}
          </div>
          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            {column2.map((category) => (
              <div
                key={category}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-foreground">{category}</span>
                <span className="text-sm text-foreground/60">00:00</span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProductivityTimeCard;
