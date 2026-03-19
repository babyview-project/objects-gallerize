import React from "react";
import { InvalidCard } from "../SingleCard";
import { Button, Box, Snackbar, Alert } from "@mui/material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Prolific completion URL — update this when starting a new study
const PROLIFIC_COMPLETION_URL = "https://app.prolific.co/submissions/complete?cc=294B5DC5mmt";

/*
A Trial contains props.num images from a single category and a check image
*/
export class Trial extends React.Component {
    constructor(props) {
        super(props);
        this.addInvalid = this.addInvalid.bind(this);
        this.removeInvalid = this.removeInvalid.bind(this);
        this.findCheck = this.findCheck.bind(this);
        this.cancelCheck = this.cancelCheck.bind(this);

        let checkFiles = Array.from({length: 11}, (x,i) => i.toString() + '.png');
        checkFiles.sort(() => Math.random() - 0.5);

        this.state = {
            showPage: props.showPage,
            buttonText: 'Next Category',
            classIdx: -1,
            toRet: [],
            nextDisable: false,
            invalidDrawings: [],
            curClass: '',
            checkList: checkFiles,
            snackbarOpen: false,
        }
    }

    findCheck() {
        this.setState({ nextDisable: false });
    }

    cancelCheck() {
        this.setState({ nextDisable: true });
    }

    addInvalid(drawing) {
        this.state.invalidDrawings.push(drawing);
    }

    removeInvalid(drawing) {
        let index = this.state.invalidDrawings.findIndex(x => x.filename === drawing.filename);
        if (index !== -1) {
            this.state.invalidDrawings.splice(index, 1);
        }
    }

    nextPage() {
        if (this.state.nextDisable) {
            this.setState({ snackbarOpen: true });
            return;
        }

        if (this.state.classIdx === this.props.allClasses.length - 1) {
            window.location.href = PROLIFIC_COMPLETION_URL;
            return;
        }

        if (this.state.classIdx === this.props.allClasses.length - 2) {
            this.setState({ buttonText: 'Submit' });
        }

        if (this.state.invalidDrawings.length > 0) {
            axios.post(`${API_URL}/db/post-response`, this.state.invalidDrawings)
                .then(() => {
                    this.setState({ invalidDrawings: [] });
                })
                .catch(error => {
                    console.log(error);
                });
        }

        let nextIdx = this.state.classIdx + 1;
        let curClass = this.props.allClasses[nextIdx];
        let prolificPID = new URLSearchParams(window.location.search).get('PROLIFIC_PID') || 'preview';
        let filter = {
            class: curClass,
            num: this.props.num,
            worker_id: prolificPID,
        };
        this.fetch(filter);
        this.setState({
            classIdx: nextIdx,
            nextDisable: true,
        });
    }

    showPage() {
        this.setState({ showPage: true });
        this.nextPage();
    }

    enableNext() {
        this.setState({ nextDisable: false });
    }

    fetch(filter) {
        axios.post(`${API_URL}/db/get-single-class`, filter)
            .then(response => {
                if (response.data.length > 0) {
                    let toRet = response.data.map(curDraw => {
                        curDraw['valid'] = 0;
                        return <InvalidCard
                            input={curDraw}
                            key={curDraw._id}
                            popUp={false}
                            validShow={false}
                            handleInvalid={this.addInvalid}
                            cancelInvalid={this.removeInvalid}
                        />;
                    });

                    let fn = this.state.checkList[this.state.classIdx];
                    let checkData = { url: require('../../assets/check/' + fn), valid: 0, _id: this.state.classIdx, fname: fn, class: filter.class };
                    let checkCard = <InvalidCard
                        input={checkData}
                        key={checkData._id}
                        local={true}
                        hasCancel={true}
                        handleCheck={this.findCheck}
                        cancelCheck={this.cancelCheck} />;

                    toRet.push(checkCard);
                    toRet.sort(() => Math.random() - 0.5);

                    this.setState({ toRet, curClass: filter.class });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    render() {
        let refImg = "";
        if (['this square', 'square'].includes(this.state.curClass)) {
            refImg = require('../../assets/reference/square_ref.png');
        } else if (this.state.curClass === 'shape') {
            refImg = require('../../assets/reference/shape_ref.png');
        }

        return (
            <div style={{ display: this.state.showPage ? "block" : "none" }}>
                <div>
                    <Box display="flex" justifyContent="center" alignItems="center" style={{ padding: '10px' }}>
                        <Button variant="contained" onClick={() => this.nextPage()}>{this.state.buttonText}</Button>
                        <div style={{ paddingLeft: '20px' }}> {this.state.classIdx + 1}/{this.props.allClasses.length} </div>
                    </Box>

                    <Box display="flex" justifyContent="center" alignItems="center" style={{ padding: '10px', textAlign: "center" }}>
                        <Box flex={1}><h3 style={{ textAlign: "center", top: "30px" }}><p>Please identify all invalid drawings of <b>{this.props.allClasses[this.state.classIdx]}</b></p></h3></Box>
                        <Box flex={1}><h4 style={{ textAlign: "center", top: "30px" }}><p>Remember that unrecognizable drawings are still valid drawings.</p></h4></Box>
                        <Box><img src={refImg} style={{ width: '60px' }} alt="" /></Box>
                    </Box>
                    {this.state.toRet}
                </div>

                <Snackbar
                    open={this.state.snackbarOpen}
                    autoHideDuration={4000}
                    onClose={() => this.setState({ snackbarOpen: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert severity="warning" onClose={() => this.setState({ snackbarOpen: false })}>
                        There are missing invalid drawings. Please check again!
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}
