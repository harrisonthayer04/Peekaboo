# Project Overview

## The idea

A real-time visual conversation app that lets you have a face-to-face style call with an AI. Point your webcam at anything — yourself, an object, a room, a document — and the AI sees what you see. Ask it questions, have a conversation, or just let it describe your world back to you. It's FaceTime, but the other person is an AI that can actually see.

## The problem

Today's AI chatbots are text-first. You type, they type back. But humans don't communicate that way. We point at things. We hold stuff up. We say "what is this?" while showing something with our hands. The gap between how we naturally communicate and how we interact with AI is massive. Copy-pasting images into a chat window is clunky. Describing what you're looking at defeats the purpose of asking in the first place.

There's no simple, seamless way to just show an AI what you're seeing and talk about it in real time.

## The solution

A split-screen interface that mirrors the experience of a video call. On one side, your live camera feed. On the other, a running conversation. The AI watches through your camera and participates in the conversation with full visual context. Every message the AI receives includes what it's currently seeing through your lens, so the conversation always has visual grounding.

The interaction is as simple as opening the app, turning on your camera, and chatting.

## How it works

The app captures your webcam feed and displays it as a live preview — just like any video call. When you send a message, the app takes a snapshot of the current camera frame and packages it alongside your text. The AI receives both the image and your message, understands the visual context, and responds accordingly.

This isn't video streaming in the traditional sense. The AI doesn't watch a continuous feed. Instead, it sees a frozen moment each time you interact — like glancing up during a conversation. This keeps the interaction snappy and cost-effective while still feeling real-time.

You type a message. The AI sees what your camera sees at that moment and responds in text. The chat panel keeps a full scrollable history so you can reference earlier exchanges.

## The interface

The design is modeled after a FaceTime call. The layout is split into two zones:

### The camera panel

Takes up roughly two-thirds of the screen. Shows your live webcam feed front and center. Overlaid on the feed are minimal controls: a camera toggle to enable or disable visual input, a snapshot button to explicitly capture a frame, and an end session button. A status indicator shows the current connection state and which AI model is active.

In the corner of the camera panel sits a small branded badge showing the logo of the active AI model. When the AI is processing a request, this badge comes alive with a rotating ambient glow effect — a visual cue that the AI is "thinking" about what it sees. When idle, the badge sits quietly as a static logo.

### The chat panel

Occupies the remaining third of the screen as a sidebar. Messages flow in a familiar chat bubble format — your messages on the right in blue, AI responses on the left in a neutral tone. Timestamps mark each exchange. When the AI is generating a response, animated dots appear in the chat alongside the glowing avatar badge, so you get feedback in both zones simultaneously.

At the bottom of the chat panel, quick-action pills provide shortcuts: triggering a manual snapshot or switching the active AI model on the fly.

## Camera control

The camera can be toggled on and off at any time. When disabled, the AI stops receiving visual input and the conversation becomes text-only — useful when you want to continue a discussion without sharing your environment, or when you're in a private setting. The transition is seamless; the AI adapts to having or not having visual context without breaking the conversation flow.

## Model flexibility

The app is designed to be model-agnostic. Rather than being locked into a single AI provider, it routes requests through a unified gateway that supports multiple vision-capable language models. You can swap models mid-conversation — maybe start with a fast, lightweight model for casual questions, then switch to a more powerful one when you need deeper analysis. The currently active model is always visible in the interface, and changing it is a one-tap action.

This also means the app naturally improves over time as better models become available, without requiring any changes to the app itself.

## Use cases

### Learning and curiosity

Hold up a plant and ask what species it is. Point at a circuit board and ask what each component does. Show it a math problem on a whiteboard and work through the solution together. The AI becomes a patient tutor that can see the subject material directly.

### Accessibility

For users with visual impairments, the app can continuously describe their surroundings, read text from documents or screens, identify objects, and provide spatial awareness — all through natural conversation.

### Cooking

Set your phone up in the kitchen and have the AI watch you cook. Ask if the onions look caramelized enough. Show it the spice rack and ask what would go well with what you're making. Get real-time visual feedback without leaving the kitchen.

### Remote troubleshooting

Point your camera at a leaky pipe, a confusing error on a screen, a tangled mess of cables, or a piece of furniture you're assembling. The AI sees the problem and talks you through a solution in real time.

### Creative work

Show the AI your sketch, your painting in progress, your room layout, your outfit. Get instant visual feedback and suggestions from a collaborator that can actually see your work.

### Identification and research

Encounter something you don't recognize — a bug, a symbol, a piece of hardware, a font, a building style — point your camera at it and ask. The AI identifies it and can dive deeper into conversation about it.

## Design philosophy

The app should feel invisible. The technology disappears behind a familiar interaction pattern — a video call. There's no learning curve because everyone already knows how to FaceTime someone. The only difference is that the other participant happens to be an AI with superhuman visual understanding.

Speed matters more than perfection. A response that arrives in two seconds with 90% accuracy is more valuable in this context than a perfect response that takes ten. The conversational format means you can always follow up, clarify, and refine — just like talking to a real person.

The interface stays out of the way. Controls are minimal and overlaid. The camera feed dominates because that's the point — you're showing, not clicking. The chat panel is always available but never intrusive.

## What this is not

This is not a surveillance tool. There is no recording, no storage of camera feeds, no background processing. The AI sees a single frame at the moment you interact with it, and that frame is discarded after the response is generated.

This is not a real-time video analysis system. It doesn't track motion, detect faces, or run continuous computer vision. It's a conversational tool that happens to accept visual input — closer to texting someone a photo than running a security camera through an algorithm.

This is not a replacement for professional advice. The AI can describe what it sees and offer general knowledge, but it's not a doctor diagnosing a rash, a mechanic certifying a repair, or an electrician approving a wiring job. It's a smart companion with eyes, not a licensed professional.
