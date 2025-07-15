
import { useRef, useCallback, useEffect, useState } from 'react';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';
import { useRealTimeEmotionDetection } from './useRealTimeEmotionDetection';

export const useEmotionDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean = true
) => {
  // Use the new real-time emotion detection system
  const realTimeEmotion = useRealTimeEmotionDetection(videoRef, isActive);

  // Return the emotion data with additional compatibility fields
  return {
    // Core emotion data
    dominant: realTimeEmotion.dominant,
    confidence: realTimeEmotion.confidence,
    scores: realTimeEmotion.scores,
    icon: realTimeEmotion.icon,
    
    // Additional fields for compatibility
    analysis: null,
    isEnhanced: true,
    reliability: realTimeEmotion.confidence > 0.7 ? 'high' : 
                realTimeEmotion.confidence > 0.5 ? 'medium' : 'low',
    isInitialized: realTimeEmotion.isInitialized,
    isProcessing: realTimeEmotion.isProcessing
  };
};
