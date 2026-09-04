# StudyGuard AI

> An adaptive study-session assistant that monitors presence and detectable distractions while helping students build consistent study habits.

## Live Demo

https://studyguard-ai-web-ap-w7ye.bolt.host

## Features

- Four study modes: Desk, Reading, Active/Walking, and Lecture
- Browser-based person and mobile-phone detection
- 3-second phone-distraction confirmation and cooldown
- 20-second Away detection
- Focused, Not Focused, Phone Distraction, Away, and Uncertain session states
- Study timer, session reports, and session history
- Rule-based Study Coach with browser voice output
- Daily study goals and subject tracking
- Today / This Week / This Month analytics
- Personalized study insights
- GPU-to-CPU fallback for detection model initialization

## Technology Stack

- React
- TypeScript
- Vite
- MediaPipe Tasks Vision
- EfficientDet-Lite0
- MediaPipe Face Landmarker
- Web Speech API
- LocalStorage
- Tailwind CSS

## Privacy

Camera input is used for real-time browser-based detection. Camera footage is not intentionally stored. Study goals and session history are stored locally in the browser. The current version does not require an account or external backend.

## Limitations

Computer-vision results can vary with lighting, camera quality, framing, object visibility, and device/browser performance. StudyGuard AI does not claim to perfectly determine whether a student is academically studying; it monitors detectable presence and distraction signals within the selected study context.

## Development

This project was created through AI-assisted development, with product design, feature specification, debugging, integration decisions, and real-world testing carried out during development.

## Author

Rudrakashi Sagar — B.Tech CSE, Government Women's Engineering College, Ajmer
