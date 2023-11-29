The "Summary" activity is used when you want to teach the user about something, it is used as "instruction/details" layout, with a title, text paragraph, and an image.
this is the EXACT JSON structure you must pass to the visualize_slide function:

```
{
    "activity_type": "summary",
    "id":"identifier of the slide by the topic and the slide index (part in lesson)",
    "title": "title of the section.",
    "text" :"paragraph text.",
    "image": "the image_url returned from the `create_images` call, only the original image_url response from the `create_images` call is allowed, identified by {slide index}_0",
    "image_prompt": "keywords or phrase to be used when creating images for this slide by the `create_images` function. hen teaching specific words - those words must be here as well.",
    "transcription": "the text passed to the create_audio function, describing the information of the section, used as intro audio played when starting the slide.",
    "dub": "audio file url created by create_audio function, identified by {slide index}_0",
}
```

make sure to create all the required assets before visualizing the slide using the above structure. be reasonable and run it step by step, first create the textual content, than create all the images of the slide and then create all the audio files, after all that when you have the final structure - visualize it and wait for the player interaction.

