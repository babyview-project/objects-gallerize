import React from "react";
import { Button, Card, CardContent, Dialog, DialogTitle, DialogContent, Alert } from "@mui/material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

/*
The DrawCard component shows a drawing in a card.
When the user click on the card, detailed information about the drawing is shown in an info dialog
*/
class DrawCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.input,
      dialogVisible: false,
    };
  }

  popUp() {
    if (this.props.popUp) {
      this.setState({ dialogVisible: true });
    }
  }

  render() {
    return (
      <Card
        className="single"
        key={this.state.item.filename}
        sx={{ display: 'inline-block', margin: '5px', verticalAlign: 'top' }}
      >
        <CardContent sx={{ padding: '5px !important', width: '180px', minHeight: '200px' }}>
          <PicLink
            popUp={this.popUp.bind(this)}
            valid={this.props.value}
            url={this.state.item.url}
          />

          <Dialog
            open={this.state.dialogVisible}
            onClose={() => this.setState({ dialogVisible: false })}
          >
            <DialogTitle>Detailed Information</DialogTitle>
            <DialogContent>
              <p> {"File name: " + this.state.item.filename} </p>
              <p> {"Age: " + this.state.item.age}</p>
              <p> {"GameID: " + this.state.item.gameID} </p>
              <p> {"Class: " + this.state.item.class}</p>
              <p> {"repetition: " + this.state.item.repetition}</p>
              <p> {"trialNUm: " + this.state.item.trialNum}</p>
              <p> {"Condition: " + this.state.item.condition}</p>
              <img
                style={{ display: "block", width: "50%", height: "50%", margin: "auto" }}
                src={this.state.item.url}
                alt={"img"}
              />
            </DialogContent>
          </Dialog>
          {this.props.children}
        </CardContent>
      </Card>
    );
  }
}

/*
The InvalidCard component allows users to label a drawing as invalid.

- props.local: whether the card takes local images

Local Card 1: Practice Card
- props.hasAlert: whether the card shows an alert message after clicking on the invalid button
- props.handleAlertCard: callback of the parent to deal with actions after the alert shows up

Local Card 2: Check Card
- props.hasCancel: whether the card shows a cancel button after clicking on the invalid button
- props.handleCheck: the parent component's actions after the check card is labeled as invalid
- props.cancelCheck: the parent component's actions after the invalid state of the card is reverted

Non-Local Card/Real Trial Card
- props.handleInvalid
- props.cancelInvalid
*/
class InvalidCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.input,
      value: this.props.input.valid,
      invalidShow: true,
      cancelShow: false,
      alertShow: false,
    };
  }

  getInstanceInfo() {
    let prolificPID = new URLSearchParams(window.location.search).get('PROLIFIC_PID') || 'preview';
    return {
      filename: this.props.input.filename,
      class: this.props.input.class,
      date: new Date(),
      worker_id: prolificPID
    };
  }

  markInvalid() {
    this.setState({
      value: -1,
      invalidShow: false,
      cancelShow: true
    });
    this.props.handleInvalid(this.getInstanceInfo());
  }

  cancelInvalid() {
    this.setState({
      invalidShow: true,
      cancelShow: false,
      value: 0
    });

    if (this.props.local) {
      this.props.cancelCheck();
    } else {
      this.props.cancelInvalid(this.getInstanceInfo());
    }
  }

  update() {
    if (!this.props.local) {
      this.markInvalid();
    } else {
      if (this.props.hasAlert) {
        if (this.props.alertType === "error") {
          this.props.handleAlertCard();
          this.setState({ value: -1 });
        }
        this.setState({
          alertShow: true,
          invalidShow: false
        });
      }

      if (this.props.hasCancel) {
        this.props.handleCheck();
        this.setState({
          cancelShow: true,
          invalidShow: false,
          value: -1
        });
      }
    }
  }

  render() {
    return (
      <DrawCard input={this.props.input} popUp={false} value={this.state.value}>
        {this.state.alertShow && (
          <Alert
            severity={this.props.alertType === 'error' ? 'error' : 'warning'}
            sx={{ lineHeight: 1, padding: '2px', marginTop: '10px' }}
          >
            {this.props.invalidMsg || ""}
          </Alert>
        )}
        <div style={{ padding: '8px 0' }}>
          <p style={{ display: "inline", margin: 0 }}>{this.state.item.class}</p>
          <div style={{ marginTop: "10px", display: 'flex', justifyContent: 'space-between' }}>
            {this.state.cancelShow && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => this.cancelInvalid()}
              >
                Cancel
              </Button>
            )}
            {this.state.invalidShow && (
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => this.update()}
              >
                Invalid
              </Button>
            )}
          </div>
        </div>
      </DrawCard>
    );
  }
}

class SingleCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: this.props.input,
      value: this.props.input.valid,
    };
  }

  update(newValid) {
    axios
      .put(`${API_URL}/db/update-data`, {
        valid: newValid,
        filename: this.state.item.filename
      })
      .then(response => {
        if (response.status === 200) {
          this.setState({ value: newValid });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  render() {
    return (
      <DrawCard input={this.props.input} popUp={false} value={this.state.value}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ display: "inline", margin: 0 }}>{this.state.item.class}</p>
          <div style={{ marginTop: "10px", display: 'flex', justifyContent: 'space-between' }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => this.update(1)}
            >
              valid
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => this.update(-1)}
            >
              Invalid
            </Button>
          </div>
          <br />
        </div>
      </DrawCard>
    );
  }
}

class PicLink extends React.Component {
  render() {
    if (this.props.valid === 0) {
      return (
        <div>
          <img onClick={() => this.props.popUp()} src={this.props.url} alt="Kid Draw" />
        </div>
      );
    }
    if (this.props.valid === 1) {
      return (
        <div className="valid">
          <img onClick={() => this.props.popUp()} src={this.props.url} alt="Kid Draw" />
        </div>
      );
    }
    return (
      <div className="invalid">
        <img onClick={() => this.props.popUp()} src={this.props.url} alt="Kid Draw" />
      </div>
    );
  }
}

export { SingleCard, InvalidCard };
