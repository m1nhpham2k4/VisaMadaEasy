import React from 'react';
import './Checkbox.css';
import { ReactComponent as CheckboxShape } from '../../../assets/icons/checkbox_shape.svg';
import { ReactComponent as CheckboxVector } from '../../../assets/icons/checkbox_vector.svg';

const Checkbox = ({ checked, onChange }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onChange) {
      onChange();
    }
  };

  return (
    <div className={`custom-checkbox-icon ${checked ? 'checked' : ''}`} onClick={handleClick}>
      <CheckboxShape className="checkbox-shape-svg" />
      {checked && <CheckboxVector className="checkbox-vector-svg" />}
    </div>
  );
};

export default Checkbox; 