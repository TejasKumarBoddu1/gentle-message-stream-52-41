
import { useEffect, useRef, useState } from 'react';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';
import { initializeFaceDetection } from '@/utils/mediapipe/faceDetection';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const useEmotionDetection = (videoRef: React.RefObject<HTMLVideoElement>, isActive: boolean = false) => {
  const [emotionState, setEmotionState] = useState<EmotionState>({
    dominant: 'neutral',
    confidence: 0,
    scores: {
      happy: 0,
      sad: 0,
      surprised: 0,
      neutral: 1,
      disgust: 0,
      angry: 0,
      fearful: 0
    },
    icon: '😐'
  });

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const isInitializedRef = useRef(false);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;

    const initializeDetection = async () => {
      if (!isActive || isInitializedRef.current) return;

      try {
        console.log('Initializing MediaPipe Face Landmarker...');
        
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
        );

        if (!isMounted) return;

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        });

        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
          isInitializedRef.current = true;
          console.log('MediaPipe Face Landmarker initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize MediaPipe Face Landmarker:', error);
        // Fallback to basic emotion state
        if (isMounted) {
          setEmotionState({
            dominant: 'neutral',
            confidence: 0,
            scores: {
              happy: 0,
              sad: 0,
              surprised: 0,
              neutral: 1,
              disgust: 0,
              angry: 0,
              fearful: 0
            },
            icon: '😐'
          });
        }
      }
    };

    initializeDetection();

    return () => {
      isMounted = false;
    };
  }, [isActive]);

  // Real-time emotion detection
  useEffect(() => {
    if (!isActive || !faceLandmarkerRef.current || !videoRef.current) {
      return;
    }

    const detectEmotions = () => {
      const video = videoRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (!video || !faceLandmarker || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(detectEmotions);
        return;
      }

      const currentTime = video.currentTime;
      
      // Only process if video time has changed (new frame)
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        try {
          // Convert current time to milliseconds for MediaPipe
          const timestamp = performance.now();
          
          // Detect faces and blendshapes
          const results = faceLandmarker.detectForVideo(video, timestamp);
          
          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            // Process the blendshapes to determine emotion
            const blendshapes = results.faceBlendshapes[0];
            const newEmotionState = analyzeBlendshapes(blendshapes);
            setEmotionState(newEmotionState);
          } else {
            // No face detected
            setEmotionState({
              dominant: 'neutral',
              confidence: 0,
              scores: {
                happy: 0,
                sad: 0,
                surprised: 0,
                neutral: 1,
                disgust: 0,
                angry: 0,
                fearful: 0
              },
              icon: '😐'
            });
          }
        } catch (error) {
          console.error('Error during emotion detection:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectEmotions);
    };

    detectEmotions();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, videoRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
        isInitializedRef.current = false;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return emotionState;
};

// Analyze MediaPipe blendshapes to determine emotion
const analyzeBlendshapes = (blendshapes: any): EmotionState => {
  const categories = blendshapes.categories || [];
  
  // Helper to get blendshape score
  const getScore = (name: string): number => {
    const category = categories.find((c: any) => c.categoryName === name);
    return category ? Math.max(0, Math.min(1, category.score)) : 0;
  };

  // Map blendshapes to emotions with improved weights
  const scores = {
    happy: Math.max(
      getScore('mouthSmileLeft') * 0.4,
      getScore('mouthSmileRight') * 0.4,
      getScore('cheekSquintLeft') * 0.3,
      getScore('cheekSquintRight') * 0.3,
      getScore('mouthUpperUpLeft') * 0.2,
      getScore('mouthUpperUpRight') * 0.2
    ),
    
    sad: Math.max(
      getScore('mouthFrownLeft') * 0.5,
      getScore('mouthFrownRight') * 0.5,
      getScore('mouthLowerDownLeft') * 0.3,
      getScore('mouthLowerDownRight') * 0.3,
      getScore('browDownLeft') * 0.2,
      getScore('browDownRight') * 0.2
    ),
    
    surprised: Math.max(
      getScore('eyeWideLeft') * 0.4,
      getScore('eyeWideRight') * 0.4,
      getScore('jawOpen') * 0.4,
      getScore('mouthFunnel') * 0.3,
      getScore('browOuterUpLeft') * 0.2,
      getScore('browOuterUpRight') * 0.2
    ),
    
    angry: Math.max(
      getScore('browDownLeft') * 0.4,
      getScore('browDownRight') * 0.4,
      getScore('eyeSquintLeft') * 0.3,
      getScore('eyeSquintRight') * 0.3,
      getScore('mouthPressLeft') * 0.3,
      getScore('mouthPressRight') * 0.3
    ),
    
    disgust: Math.max(
      getScore('noseSneerLeft') * 0.5,
      getScore('noseSneerRight') * 0.5,
      getScore('mouthUpperUpLeft') * 0.3,
      getScore('mouthUpperUpRight') * 0.3,
      getScore('cheekSquintLeft') * 0.2,
      getScore('cheekSquintRight') * 0.2
    ),
    
    fearful: Math.max(
      getScore('eyeWideLeft') * 0.3,
      getScore('eyeWideRight') * 0.3,
      getScore('browInnerUp') * 0.4,
      getScore('mouthStretchLeft') * 0.3,
      getScore('mouthStretchRight') * 0.3
    ),
    
    neutral: 1 - Math.max(
      getScore('mouthSmileLeft'),
      getScore('mouthSmileRight'),
      getScore('mouthFrownLeft'),
      getScore('mouthFrownRight'),
      getScore('eyeWideLeft'),
      getScore('eyeWideRight'),
      getScore('browDownLeft'),
      getScore('browDownRight')
    )
  };

  // Normalize scores to ensure they sum to 1
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  if (totalScore > 0) {
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = scores[key as keyof typeof scores] / totalScore;
    });
  }

  // Find dominant emotion
  const emotionEntries = Object.entries(scores);
  const [dominantEmotion, confidence] = emotionEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  // Emotion icons
  const emotionIcons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    surprised: '😮',
    angry: '😠',
    disgust: '🤢',
    fearful: '😨',
    neutral: '😐'
  };

  return {
    dominant: dominantEmotion,
    confidence: Math.min(confidence * 2, 1), // Amplify confidence for better UX
    scores,
    icon: emotionIcons[dominantEmotion] || '😐',
    timestamp: Date.now()
  };
};
