import Lottie from "lottie-react";

const emptyBoxAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Empty Box",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Box",
      sr: 1,
      ks: {
        o: { a: 0, k: 80 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 0], e: [100, 95, 0] },
            { t: 45, s: [100, 95, 0], e: [100, 100, 0] },
            { t: 90, s: [100, 100, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              s: { a: 0, k: [100, 80] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 8 }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.6, 0.6, 0.6, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 1
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.95, 0.95, 0.95, 1] },
              o: { a: 0, k: 30 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dots",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30], e: [100] },
            { t: 30, s: [100], e: [30] },
            { t: 60, s: [30], e: [100] },
            { t: 90, s: [100] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 110, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [8, 8] },
              p: { a: 0, k: [-15, 0] }
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [8, 8] },
              p: { a: 0, k: [0, 0] }
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [8, 8] },
              p: { a: 0, k: [15, 0] }
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.6, 0.6, 0.6, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0
    }
  ]
};

interface EmptyStateAnimationProps {
  size?: number;
  message?: string;
  className?: string;
}

export default function EmptyStateAnimation({ 
  size = 150, 
  message = "Aucun élément trouvé",
  className = "" 
}: EmptyStateAnimationProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`} data-testid="lottie-empty">
      <Lottie
        animationData={emptyBoxAnimation}
        loop={true}
        style={{ width: size, height: size }}
      />
      <p className="text-muted-foreground mt-4 text-center">{message}</p>
    </div>
  );
}
