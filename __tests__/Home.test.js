import { render, screen } from '@testing-library/react'
import Home from '../app/page' // Adjust the import path to your Home component

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /Toko Sakinah/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('renders all login links', () => {
    render(<Home />)
    
    const adminLogin = screen.getByRole('link', { name: /Login Admin/i })
    const cashierLogin = screen.getByRole('link', { name: /Login Kasir/i })
    const attendantLogin =
      screen.getByRole('link', { name: /Login Pelayan/i })

    expect(adminLogin).toBeInTheDocument()
    expect(cashierLogin).toBeInTheDocument()
    expect(attendantLogin).toBeInTheDocument()
  })
})
