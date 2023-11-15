export const constants = {
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions', // OpenAI API endpoint
  DID_API_URL: 'https://api.d-id.com', // D-ID API base URL
  SOURCE_URL:
    'https://i.ibb.co/T2xw6pc/DALL-E-2023-11-15-04-43-18-Cartoon-illustration-of-an-action-figure-cowboy-designed-for-middle-schoo.png', // URL to the image used for the avatar
  DRIVER_URL: 'bank://lively/', // Driver URL for D-ID
  STREAMING_CONFIG: {
    // Configuration settings for D-ID streaming
    fluent: true,
    pad_audio: 0,
    driver_expressions: {
      expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
      transition_frames: 0,
    },
    align_driver: true,
    align_expand_factor: 0,
    auto_match: true,
    motion_factor: 0,
    normalization_factor: 0,
    sharpen: true,
    stitch: true,
    result_format: 'mp4',
  },
}

