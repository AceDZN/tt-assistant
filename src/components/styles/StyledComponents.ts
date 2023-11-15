// styles/StyledComponents.ts
import styled from 'styled-components'

export const GameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`

export const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 3; // Occupies 3/4 of the container
`

export const HangmanContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  color: #333;
`

export const WordDisplay = styled.div`
  margin: 20px 0;
  font-size: 24px;
  letter-spacing: 2px;
`

export const AlphabetButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 10px 0;

  button {
    margin: 5px;
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }
`

export const HangmanFigure = styled.div`
  flex: 1; // Occupies 1/3 of the container
  max-width: 33%;
  justify-self: center;
  align-self: center;
  img {
    width: 100%;
    height: auto;
  }
`

export const GameStateIndicators = styled.div`
  margin: 10px 0;
  font-size: 18px;
`

export const GameControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  button {
    margin: 10px;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: #28a745;
    color: white;
    cursor: pointer;
    &.has-icon {
      padding: 10px;
    }
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    &:hover {
      background-color: #218838;
    }
    &.active {
      background-color: #0b591d;
    }
  }
`

export const GuessedLettersDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 10px 0;
  span {
    font-family: 'Monospace';
    font-size: 12px;
    padding: 4px;
    background-color: white;
    color: lightblue;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
    margin: 2px;
  }
`

export const HintDescription = styled.h3`
  margin-bottom: 20px;
  color: #007bff;
  font-size: 20px;
`

