import React from 'react';
import PropTypes from 'prop-types';
import Events from '../../lib/Events';
var INSPECTOR = require('../../lib/inspector.js');
import Select from 'react-select';
import 'react-select/dist/react-select.css';

var DELIMITER = ' ';

export default class AddComponent extends React.Component {
  static propTypes = {
    entity: PropTypes.object
  };

  /**
   * Add blank component.
   * If component is instanced, generate an ID.
   */
  addComponent = (componentName) => {
    var entity = this.props.entity;
    var packageName;
    var selectedOption = this.options.filter(function (option) {
      return option.value === componentName;
    })[0];

    if (selectedOption.origin === 'registry') {
      [packageName, componentName] = selectedOption.value.split(DELIMITER);
      INSPECTOR.componentLoader.addComponentToScene(packageName, componentName)
        .then(addComponent);
    } else {
      componentName = selectedOption.value;
      addComponent(componentName);
    }

    function addComponent (componentName) {
      if (AFRAME.components[componentName].multiple) {
        const id = prompt(
          `Provide an ID for this component (e.g., 'foo' for ${componentName}__foo).`);
        componentName = id ? `${componentName}__${id}` : componentName;
      }

      entity.setAttribute(componentName, '');
      Events.emit('componentadded', {entity: entity, component: componentName});
      ga('send', 'event', 'Components', 'addComponent', componentName);
    }
  }

  /**
   * Component dropdown options.
   */
  getComponentsOptions () {
    const usedComponents = Object.keys(this.props.entity.components);
    var commonOptions = Object.keys(AFRAME.components)
      .filter(function (componentName) {
        return AFRAME.components[componentName].multiple ||
               usedComponents.indexOf(componentName) === -1;
      })
      .sort()
      .map(function (value) {
        return {value: value, label: value, origin: 'loaded'};
      });

    // Create the list of components that should appear in the registry group
    var registryComponents = [];
    Object.keys(INSPECTOR.componentLoader.components)
      .forEach(function (componentPackageName) {
        var componentPackage = INSPECTOR.componentLoader.components[componentPackageName];
        componentPackage.names.forEach(function (componentName) {
          if (usedComponents.indexOf(componentName) === -1) {
            registryComponents.push({componentPackageName, componentName});
          }
        });
      });
    var registryOptions = registryComponents
      .map(function (item) {
        return {value: item.componentPackageName + DELIMITER + item.componentName,
          label: item.componentName, origin: 'registry'};
      });

    this.options = commonOptions.concat(registryOptions);
    this.options = this.options.sort(function (a, b) {
      return a.label === b.label ? 0 : a.label < b.label ? -1 : 1;
    });
  }

  renderOption (option) {
    var bullet = <span title="Component already loaded in the scene">&#9679;</span>;
    return <strong className="option">{option.label} {option.origin === 'loaded' ? bullet : ''}</strong>;
  }

  render () {
    const entity = this.props.entity;
    if (!entity) { return <div></div>; }

    this.getComponentsOptions();

    return (
        <div className='add-component-container'>
          <Select
            className="add-component"
            ref="select"
            options={this.options}
            simpleValue
            clearable={true}
            placeholder="Add component..."
            noResultsText="No components found"
            onChange={this.addComponent}
            optionRenderer={this.renderOption}
            searchable={true}
          />
          <a href="https://aframe.io/aframe-registry" target="_blank" title="A-Frame Registry" className="aregistry-button">
            <img src="https://aframe.io/aframe-inspector/assets/a-registry-logo-min.svg"/>
          </a>
        </div>
    );
  }
}

/**
 * Check if component has multiplicity.
 */
function isComponentInstanced (entity, componentName) {
  for (var component in entity.components) {
    if (component.substr(0, component.indexOf('__')) === componentName) {
      return true;
    }
  }
}
