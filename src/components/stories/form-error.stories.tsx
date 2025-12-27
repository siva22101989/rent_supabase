import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from '../shared/form-error';

const meta: Meta<typeof FormError> = {
  title: 'Components/Shared/FormError',
  component: FormError,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormError>;

export const Default: Story = {
  args: {
    message: 'Something went wrong. Please try again.',
  },
};

export const MultiLine: Story = {
  args: {
    message: 'Validation failed:\n- Name is required\n- Phone must be valid',
  },
};

export const CustomStyle: Story = {
    args: {
        message: 'Critical error encountered',
        className: 'border-2 border-red-500 font-bold'
    }
}
