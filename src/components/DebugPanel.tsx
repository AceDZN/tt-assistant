import React, { useState } from 'react'
import styled from 'styled-components'

// Define the styled components
// Define the styled select box with the required styles and pseudo-elements
const SelectBox = styled.select`
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  height: 26px;
  max-width: 100%;
  padding-left: 5px;
  background: transparent;
  outline: none;
  border: none;
  font-family: 'Arial', sans-serif; // Replace with your font variable
  font-size: 14px;
  color: #013a41;
  text-shadow: 0 1px 2px #9ff4ff;
  appearance: none;
  cursor: pointer;
  z-index: 1;

  &:after {
    content: '<';
    position: absolute;
    line-height: 26px;
    text-align: center;
    transform: rotate(-90deg);
    font-size: 16px;
    color: #013a41;
    text-shadow: 0 1px 2px #9ff4ff;
    top: 0;
    left: 210px;
    width: 26px;
    height: 26px;
    background: #eee; // Replace with lighten($base, 5%) variable
    cursor: pointer;
    z-index: -2;
    pointer-events: none;
  }

  option {
    background: #eee; // Replace with lighten($base, 5%) variable
    font-family: 'Arial', sans-serif; // Replace with your font variable
    font-size: 16px;
    color: #013a41;
    text-shadow: 0 1px 2px #9ff4ff;
    outline: none;
    border: none;
    z-index: -2;

    &:hover {
      background: #ddd; // Replace with lighten($base, 10%) variable
      cursor: pointer;
    }
  }
`

// Since pseudo-elements cannot be added directly within styled-components to the select element,
// a wrapper is used to simulate the behavior.
const SelectBoxWrapper = styled.div`
  position: relative;
  max-width: 100%;
  width: 250px;
  height: 26px;
  background: #a6f5ff; // Replace with lighten($base, 10%) variable
  z-index: 0;
  &:after {
    content: '<';
    position: absolute;
    line-height: 26px;
    text-align: center;
    transform: rotate(-90deg);
    font-size: 16px;
    color: #fff;
    font-weight: bold;
    top: 0;
    right: 0;
    width: 26px;
    height: 26px;
    background: #089eb2;
    cursor: pointer;
    z-index: 1;
    pointer-events: none;
  }
  label {
    position: absolute;
    top: -20px;
    font-size: 12px;
    left: 5px;
    color: #013a41;
    font-weight: bold;
  }
`
const SelectBoxesContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  margin-top: 16px;
  box-sizing: border-box;
  gap: 28px;
`

const DebugPanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(${({ $isOpen }) => ($isOpen ? '0' : 'calc(0% - calc(100% - 60px))')});

  background-color: #00bcd4;
  padding: 10px;
  border-radius: 0 0 5px 5px;
  z-index: 9999;
  transition: transform 0.3s ease-in-out;
  width: 600px;
  max-width: 80%;
`

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: absolute;
  bottom: 0;
  right: -50px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  font-size: 16px;
  z-index: 100;
  background: transparent;
  transition: transform 0.5s ease-in-out;
  transform: scaleY(${({ $isOpen }) => ($isOpen ? '-1' : '1')});
  &:hover,
  &:focus,
  &:active {
    outline: none;
    transform: scaleY(${({ $isOpen }) => ($isOpen ? '-1' : '1')}) scale(1.25);
  }
`
const MessageContainer = styled.div`
  min-height: 30px;
`
const StatusMessage = styled.div`
  color: #edfdff;
  justify-content: space-between;
  text-align: center;
  display: flex;
  justify-content: space-between;
`
const Status = styled.div`
  font-weight: bold;
`
const Step = styled.div`
  span {
    font-weight: bold;
  }
`
const Message = styled.code`
  font-size: 12px;
  line-height: 13px;
  display: block;
  text-align: left;
  padding: 6px 0;
  margin-bottom: 4px;
  color: #013a41;
  text-shadow: 0 1px 2px #9ff4ff;
`

const AGES = Array.from({ length: 8 }, (_, i) => i + 3)
const SUBJECTS = ['new words', 'reading', 'writing', 'verbs', 'general']
const INTERESTS = ['dinosaurs', 'pirates', 'space', 'animals', 'cars', 'trucks', 'trains', 'planes', 'people']
const STYLES = ['Pixar', 'Steampunk', 'Studio Ghibli', 'Rubber Hose', 'Pixel Art']
// Define the component
interface DebugPanelProps {
  step?: string
  status?: string
  message?: string
  style?: string
  age?: string
  interest?: string
  subject?: string
  onAgeChange?: (age: string) => void
  onInterestChange?: (interest: string) => void
  onSubjectChange?: (subject: string) => void
  onStyleChange?: (style: string) => void
}

const DebugPanel: React.FC<DebugPanelProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true)
  const {
    step = '-1',
    status = 'Null',
    message = undefined,
    style: _style = 'Pixar',
    age: _age = '5',
    interest: _interest = 'dinosaurs',
    subject: _subject = 'new words',
    onAgeChange,
    onInterestChange,
    onSubjectChange,
    onStyleChange,
  } = props
  const [style, setStyle] = useState(_style)
  const [age, setAge] = useState(_age)
  const [interest, setInterest] = useState(_interest)
  const [subject, setSubject] = useState(_subject)

  const handleStyleSelect = (e: any) => {
    const newStyle = e.target.value
    if (newStyle === style) return
    setStyle(e.target.value)
    onStyleChange?.(e.target.value)
  }
  const handleAgeSelect = (e: any) => {
    const newAge = e.target.value
    if (newAge === age) return
    setAge(e.target.value)
    onAgeChange?.(e.target.value)
  }
  const handleInterestSelect = (e: any) => {
    const newInterest = e.target.value
    if (newInterest === interest) return
    setInterest(e.target.value)
    onInterestChange?.(e.target.value)
  }
  const handleSubjectSelect = (e: any) => {
    const newSubject = e.target.value
    if (newSubject === subject) return
    setSubject(e.target.value)
    onSubjectChange?.(e.target.value)
  }

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <DebugPanelContainer $isOpen={isOpen}>
      <ToggleButton onClick={toggleOpen} $isOpen={isOpen}>
        <dotlottie-player src="/icons/arrows-dows.lottie" autoplay loop style={{ height: '52px', width: '52px' }} />
      </ToggleButton>
      <MessageContainer>
        <StatusMessage>
          <Status>Status: {status}</Status>
          <Step>
            Step: <span>{step}</span>
          </Step>
        </StatusMessage>
        <Message>{message}</Message>
      </MessageContainer>
      <SelectBoxesContainer>
        <SelectBoxWrapper>
          <label htmlFor="style">Style</label>
          <SelectBox value={style} onChange={handleStyleSelect}>
            {STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </SelectBox>
        </SelectBoxWrapper>
        <SelectBoxWrapper>
          <label htmlFor="age">Age</label>
          <SelectBox value={age} onChange={handleAgeSelect}>
            {AGES.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </SelectBox>
        </SelectBoxWrapper>
        <SelectBoxWrapper>
          <label htmlFor="interest">Interest</label>
          <SelectBox value={interest} onChange={handleInterestSelect}>
            {INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </SelectBox>
        </SelectBoxWrapper>
        <SelectBoxWrapper>
          <label htmlFor="subject">Subject</label>
          <SelectBox value={subject} onChange={handleSubjectSelect}>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </SelectBox>
        </SelectBoxWrapper>
      </SelectBoxesContainer>
    </DebugPanelContainer>
  )
}

export default DebugPanel

