The Quiz activity is used when you want to ask the user a question with 3 different options to choose from while only one of the options is a correct one.
this is the EXACT JSON structure you must pass to the visualize_slide function:

```
{
    "activity_type": "quiz",
    "id":"identifier of the slide by the topic and the slide index (part in lesson)",
    "image": "image url created by create_images function, identified by {slide index}_0",
    "image_prompt": "keywords or phrase to be used when creating images for this slide by the `create_images` function. hen teaching specific words - those words must be here as well.",
    "transcription": "the text passed to the create_audio function, describing the information of the section, used as intro audio played when starting the slide.",
    "dub": "audio file url created by create_audio function, identified by {slide index}_0",
    "question": {
        "text": "question text",
        "hint": "hint to the user about the correct option without saying what it is"
    }
    "options": [
        {
            text: "option text",
            correct: isOptionCorrect,
            "feedback": "response to say when chosen, used by create_audio function",
            "image": "image url created by create_images function, identified by  {slide index}_{option number}",
            "image_prompt": "keywords or phrase to be used when creating images for this option by the `create_images` function. hen teaching specific words - those words must be here as well.",
            "dub": "audio file url created by create_audio function, identified by {slide index}_{option number}",
        },
        ...
    ]
}
```

make sure to create all the required assets before visualizing the slide using the above structure. be reasonable and run it step by step, first create the textual content, than create all the images of the slide and then create all the audio files, after all that when you have the final structure - visualize it and wait for the player interaction.
