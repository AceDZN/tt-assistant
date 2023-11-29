import styled from 'styled-components'

import { useEffect } from 'react'

// Styled components
/*
const SlideContentContainer = styled.div`
  height: 100%;
  display: block;
  overflow: hidden;
  font-family: 'Mulish';
`
*/
const DebugText = styled.div`
  font-family: 'Mulish';
  font-size: 12px;
  font-weight: bold;
  color: #e6d9ff;
  text-shadow: 0px 1px 1px #321567;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Title = styled.h1`
  font-family: 'Mulish';
`
const Question = styled.h2`
  font-family: 'Mulish';
`
const Text = styled.p`
  font-family: 'Mulish';
`
const AnswersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`
const AnswerContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
`
const AnswerImage = styled.img`
  width: 250px;
  max-width: 100%;
  transition: transform 0.25s ease-in-out;
  &:hover {
    transform: scale(1.2);
  }
`
const SlideImage = styled.img`
  width: 320px;
  max-width: 100%;
  transition: transform 0.25s ease-in-out;
  &:hover {
    transform: scale(1.1);
  }
`
const AnswerText = styled.div`
  font-family: 'Mulish';
  font-size: 18px;
`
const AnswerStatus = styled.div`
  font-family: 'Mulish';
  font-size: 14px;
`

interface SlideContentProps {
  slide: any
}
// Main React Component
export const SlideContent = (props: SlideContentProps) => {
  const { slide } = props
  const { id, activity_type, structure } = slide || {}
  useEffect(() => {
    console.log('slide', slide)
  }, [props.slide])

  return activity_type && id ? (
    <div>
      <DebugText>
        <div>{slide.id}</div>
        <div>{slide.activity_type}</div>
      </DebugText>

      {structure.instructions && <Text>{structure.instructions}</Text>}
      {structure.title && <Title>{structure.title}</Title>}
      {structure.question && <Question>{structure.question}</Question>}
      {structure.text && <Text>{structure.text}</Text>}
      {structure.answers && (
        <AnswersContainer>
          {structure.answers.length &&
            structure.answers?.map((answer: any) => (
              <AnswerContainer>
                {answer.image_url && <AnswerImage src={answer.image_url} alt={answer.image_prompt} />}
                {answer.text && <AnswerText>{answer.text}</AnswerText>}
                <AnswerStatus>{answer.correct ? 'correct' : 'wrong'}</AnswerStatus>
              </AnswerContainer>
            ))}
        </AnswersContainer>
      )}

      {structure.image_url && <SlideImage src={structure.image_url} alt={structure.image_prompt} />}
    </div>
  ) : (
    'SLIDE CONTENT WILL APPEAR HERE'
  )
}

