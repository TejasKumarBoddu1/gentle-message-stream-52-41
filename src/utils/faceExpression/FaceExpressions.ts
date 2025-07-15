
export const FACE_EXPRESSION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;

export type FaceExpressionLabel = typeof FACE_EXPRESSION_LABELS[number];

export class FaceExpressions {
  public neutral: number;
  public happy: number;
  public sad: number;
  public angry: number;
  public fearful: number;
  public disgusted: number;
  public surprised: number;

  constructor(probabilities: number[] | Float32Array) {
    if (probabilities.length !== 7) {
      throw new Error(`FaceExpressions.constructor - expected probabilities.length to be 7, have: ${probabilities.length}`);
    }

    FACE_EXPRESSION_LABELS.forEach((expression, idx) => {
      this[expression] = probabilities[idx];
    });
  }

  asSortedArray() {
    return FACE_EXPRESSION_LABELS
      .map(expression => ({ expression, probability: this[expression] as number }))
      .sort((e0, e1) => e1.probability - e0.probability);
  }

  getDominantExpression(): { expression: FaceExpressionLabel; confidence: number } {
    const sorted = this.asSortedArray();
    return {
      expression: sorted[0].expression,
      confidence: sorted[0].probability
    };
  }
}
