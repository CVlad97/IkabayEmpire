import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const successAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 45,
  w: 200,
  h: 200,
  nm: "Success Checkmark",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], e: [120, 120, 100] },
            { t: 20, s: [120, 120, 100], e: [100, 100, 100] },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [80, 80] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.18, 0.8, 0.443, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 1
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
      op: 45,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 15, s: [0], e: [100] },
            { t: 25, s: [100] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-20, 0], [-5, 15], [25, -15]],
                  c: false
                }
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.18, 0.8, 0.443, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 2
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
      ip: 15,
      op: 45,
      st: 0,
      bm: 0
    }
  ]
};

interface SuccessAnimationProps {
  size?: number;
  onComplete?: () => void;
  className?: string;
}

export default function SuccessAnimation({ 
  size = 120, 
  onComplete,
  className = "" 
}: SuccessAnimationProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isComplete) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  return (
    <div className={`flex items-center justify-center ${className}`} data-testid="lottie-success">
      <Lottie
        animationData={successAnimation}
        loop={false}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
