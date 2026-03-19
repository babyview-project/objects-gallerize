import React from "react";
import { Select, MenuItem, Button, RadioGroup, FormControlLabel, Radio, FormControl, OutlinedInput } from "@mui/material";
import { CardLayout } from "./CardLayout";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
/* This is the main class including the header */
class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      order: "Age (Young - Old) Group By Class",
      allClasses: [],
      classes: [],
      ageRange: [0, 100],
      valid: 2
    };
    this.tempState = this.state;
  }

  componentDidMount() {
    axios.get(`${API_URL}/db/get-classes`)
      .then(response => {
        var classes = response.data;
        this.setState({ allClasses: classes });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleOrderChange(newOrder) {
    console.log("in handleOrderChange, changed to " + newOrder);
    this.tempState.order = newOrder;
  }

  handleClassChange(newClass) {
    console.log("in handleClassChange");
    if (newClass.length === 0) {
      console.log("changed to all classes");
      this.tempState.classes = [];
    } else {
      console.log("changed to :", newClass);
      this.tempState.classes = newClass;
    }
  }

  handleValidChange(newValue) {
    console.log("in handleValidChange, changed to " + newValue);
    this.tempState.valid = newValue;
  }

  submit(e) {
    e.preventDefault();
    console.log("in submit, the state is now: ", this.state);
    this.setState({
      order: this.tempState.order,
      classes: this.tempState.classes,
      ageRange: this.tempState.ageRange,
      valid: this.tempState.valid
    });
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-light" >
          <div style={{ float: "left", paddingLeft: "50px" }}>
            <div style={{ fontSize: "25px", fontWeight: "bold" }}>
              Cognitive Tools Lab
            </div>
          </div>

          <div style={{ display: "inline-block", padding: "10px 50px" }}>
            <SelectClass allClasses={this.state.allClasses} onSelectChange={this.handleClassChange.bind(this)} />
            <SelectValid validChange={this.handleValidChange.bind(this)} />
            <Button style={{ marginLeft: "50px" }} variant="contained" onClick={this.submit.bind(this)}>
              Submit
            </Button>
          </div>
        </nav>

        <CardLayout
          order={this.state.order}
          classes={this.state.classes}
          ageRange={this.state.ageRange}
          validToken={this.state.valid}
        />
      </div>
    );
  }
}

class SelectValid extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: "2" };
  }

  onChange(e) {
    this.setState({ value: e.target.value });
    this.props.validChange(e.target.value);
  }

  render() {
    return (
      <RadioGroup row style={{ marginLeft: '50px', display: 'inline-flex' }} value={this.state.value} onChange={this.onChange.bind(this)}>
        <FormControlLabel value="-1" control={<Radio />} label="Invalid" />
        <FormControlLabel value="0" control={<Radio />} label="Unchecked" />
        <FormControlLabel value="1" control={<Radio />} label="Valid" />
        <FormControlLabel value="2" control={<Radio />} label="ALL" />
      </RadioGroup>
    );
  }
}

class SelectClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      value: []
    };
  }

  componentWillReceiveProps(nextprops) {
    this.setState({ options: nextprops.allClasses });
  }

  render() {
    return (
      <FormControl sx={{ minWidth: 200 }} size="small">
        <Select
          multiple
          displayEmpty
          value={this.state.value}
          onChange={this.handleChange.bind(this)}
          input={<OutlinedInput />}
          renderValue={(selected) => selected.length === 0 ? <em>class by ...</em> : selected.join(', ')}
        >
          {this.state.options.map(el => (
            <MenuItem key={el} value={el}>{el}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  handleChange(event) {
    const value = event.target.value;
    this.setState({ value });
    this.props.onSelectChange(value);
  }
}

export { Main };
