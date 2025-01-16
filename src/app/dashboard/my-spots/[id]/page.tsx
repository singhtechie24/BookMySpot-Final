'use client';

export default function SpotPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Spot ID: {params.id}</h1>
    </div>
  );
} 