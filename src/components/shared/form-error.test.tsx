import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FormError } from './form-error'

describe('FormError', () => {
  it('should return null when no message is provided', () => {
    const { container } = render(<FormError />)
    expect(container.firstChild).toBeNull()
  })

  it('should render the error message when provided', () => {
    const message = 'Invalid phone number'
    const { getByText } = render(<FormError message={message} />)
    
    expect(getByText(message)).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const className = 'mt-10'
    const { container } = render(<FormError message="Error" className={className} />)
    
    expect(container.firstChild).toHaveClass(className)
  })
})
