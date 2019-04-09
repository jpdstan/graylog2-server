// @flow strict
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuItem } from 'react-bootstrap';
// $FlowFixMe: imports from core need to be fixed in flow
import { Overlay } from 'react-overlays';

/**
 * This implements a custom toggle for a dropdown menu.
 * See: "Custom Dropdown Components" in react-bootstrap documentation.
 */

type ActionToggleProps = {
  children: React.Node,
  // eslint-disable-next-line no-undef
  onClick: (SyntheticInputEvent<HTMLButtonElement>) => void,
};

const ActionToggle = ({ children, onClick }: ActionToggleProps) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    onClick(e);
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 32) {
      e.preventDefault();
      e.stopPropagation();

      onClick(e);
    }
  };

  return (
    <span onClick={handleClick} onKeyDown={handleKeyDown} role="presentation">
      {children}
    </span>
  );
};

ActionToggle.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

ActionToggle.defaultProps = {
  onClick: () => {},
};

type FilterPropsProps = {
  children: React.Node,
  style?: { [string]: any },
};

const FilterProps = ({ children, style }: FilterPropsProps) => React.Children.map(
  children,
  child => React.cloneElement(child, { style: Object.assign({}, style, child.props.style) }),
);

type ActionDropdownProps = {
  children: React.Node,
  container?: HTMLElement,
  element: React.Node,
};

type ActionDropdownState = {
  show: boolean,
};

class ActionDropdown extends React.Component<ActionDropdownProps, ActionDropdownState> {
  static defaultProps = {
    container: undefined,
  };

  constructor(props: ActionDropdownProps) {
    super(props);
    this.state = {
      show: false,
    };
  }

  // eslint-disable-next-line no-undef
  _onToggle = (e: SyntheticInputEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState(({ show }) => ({ show: !show }));
  };

  target: ?HTMLElement;

  render() {
    const { children, container, element } = this.props;
    const { show } = this.state;
    const displayMenu = show ? { display: 'block' } : { display: 'none' };
    const listStyle = {
      minWidth: 'max-content',
      color: '#666666',
    };

    const mappedChildren = React.Children.map(
      children,
      child => React.cloneElement(child, Object.assign({}, child.props, child.props.onSelect ? {
        onSelect: (eventKey, event) => {
          child.props.onSelect();
          this._onToggle(event);
        },
      } : {})),
    );
    return (
      <span>
        <ActionToggle bsRole="toggle" onClick={this._onToggle}>
          <span ref={(elem) => { this.target = elem; }}>{element}</span>
        </ActionToggle>
        <Overlay show={show}
                 container={container}
                 placement="bottom"
                 shouldUpdatePosition
                 rootClose
                 onHide={this._onToggle}
                 target={() => this.target}>
          <FilterProps>
            <ul className="dropdown-menu" style={Object.assign({}, listStyle, displayMenu)}>
              <MenuItem header>Actions</MenuItem>
              {mappedChildren}
            </ul>
          </FilterProps>
        </Overlay>
      </span>
    );
  }
}


ActionDropdown.propTypes = {
  children: PropTypes.node.isRequired,
  container: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  element: PropTypes.node.isRequired,
};

export default ActionDropdown;
