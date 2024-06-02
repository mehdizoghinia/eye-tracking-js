// components/WebcamComponent.tsx

"use client"; // This directive marks the file as a Client Component, ensuring it runs on the client side and can use hooks like useRef, useState, and useEffect.

import React, { useRef, useState, useEffect } from 'react'; // Importing necessary React hooks.
import { FilesetResolver, FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'; // Importing MediaPipe tasks for face landmark detection and drawing utilities.

const WebcamComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null); // Reference to the video element to access the webcam feed.
  const canvasRef = useRef<HTMLCanvasElement>(null); // Reference to the canvas element for drawing the video and landmarks.
  const [timer, setTimer] = useState(30 * 60); // State to hold the timer value, initialized to 30 minutes (in seconds).
  const [timerRunning, setTimerRunning] = useState(false); // State to track if the timer is running.
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null); // State to hold the face landmark detector instance.

  useEffect(() => {
    // useEffect to load the face landmark detector and start the webcam.
    const loadFaceLandmarker = async () => {
      // Function to load the face landmark detector.
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU" // Use GPU for acceleration.
        },
        runningMode: 'VIDEO', // Set the mode to video for continuous detection.
        numFaces: 1 // Detect only one face.
      });
      setFaceLandmarker(faceLandmarker); // Save the faceLandmarker instance to state.
    };

    loadFaceLandmarker(); // Call the function to load the face landmark detector.

    const startWebcam = async () => {
      // Function to start the webcam.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // Request access to the webcam.
      videoRef.current!.srcObject = stream; // Set the video source to the webcam stream.
      videoRef.current!.play(); // Play the video.
    };

    startWebcam(); // Call the function to start the webcam.
  }, []);

  useEffect(() => {
    // useEffect to handle the timer logic.
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      // If the timer is running, set an interval to decrement the timer every second.
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (!timerRunning && timer !== 0) {
      // If the timer is paused and not zero, clear the interval.
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      // Clean up the interval when the component unmounts or the timerRunning state changes.
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerRunning, timer]);

  const detectFace = async () => {
    // Function to detect faces and handle the webcam feed.
    if (faceLandmarker) {
      // If the faceLandmarker is loaded.
      const ctx = canvasRef.current!.getContext('2d')!; // Get the 2D drawing context from the canvas.
      const video = videoRef.current!; // Get the video element.
      const startTimeMs = performance.now(); // Get the current time for the detection.
      const results = await faceLandmarker.detectForVideo(video, startTimeMs); // Perform face detection on the video frame.

      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); // Clear the canvas.
      ctx.drawImage(video, 0, 0, canvasRef.current!.width, canvasRef.current!.height); // Draw the current video frame on the canvas.

      if (results.faceLandmarks.length > 0) {
        // If face landmarks are detected.
        const landmarks = results.faceLandmarks[0]; // Get the landmarks for the first detected face.
        const drawingUtils = new DrawingUtils(ctx); // Create a DrawingUtils instance for drawing the landmarks.
        
        // Draw the face landmarks on the canvas.
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });

        setTimerRunning(true); // Set the timer running state to true.
      } else {
        setTimerRunning(false); // Set the timer running state to false if no face is detected.
      }

      requestAnimationFrame(detectFace); // Request the next animation frame to continue detection.
    }
  };

  useEffect(() => {
    // useEffect to start face detection when the video is loaded.
    if (videoRef.current) {
      videoRef.current.addEventListener('loadeddata', detectFace); // Add an event listener to start face detection when the video data is loaded.
    }
  }, [faceLandmarker]); // Depend on the faceLandmarker state to ensure it's loaded before starting detection.

  return (
    <div>
      {/* Hidden video element for capturing the webcam feed. */}
      <video ref={videoRef} style={{ display: 'none' }}></video>
  
      {/* Canvas for displaying the video feed and drawing landmarks. */}
      <canvas ref={canvasRef} width="840" height="680" style={{ display: 'block', margin: 'auto' }}></canvas>
  
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {/* Display the remaining time in minutes and seconds. */}
        Time remaining: {`${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}
      </div>
    </div>
  );
};

export default WebcamComponent; // Export the WebcamComponent for use in other parts of the app.
