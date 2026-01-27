"use client";

import React from "react";
import { Card } from "@heroui/react";

const GradientCard = () => {
  return (
    <Card className="w-full h-full bg-content1 border border-white/10 hover:border-white/15 transition-colors relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cv-accent-gradient"
        style={{ opacity: 0.5 }}
      />
    </Card>
  );
};

export default GradientCard;
