import React from "react";
import { Box, Chip } from "@mui/material";
import { InvalidCard } from "../SingleCard";
import { Header } from "../helper/header"
import axios from "axios";
import { Instruction, Timeline } from "./instruction";
import { Trial } from "./Trial";

const API_URL = process.env.REACT_APP_API_URL;

class Study extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            allClasses: [],
            shuffledIndex: null
        };
        this.enableNextButton = this.enableNextButton.bind(this);
        this.disableNextButton = this.disableNextButton.bind(this);
        this.redirect = this.redirect.bind(this);

        this.intro = React.createRef();
        this.exp = React.createRef();
    }

    componentDidMount() {
        const worker_id = new URLSearchParams(window.location.search).get('PROLIFIC_PID') || 'preview';

        const assignIndex = axios.post(`${API_URL}/db/assign-worker-index`, { worker_id })
            .then(response => {
                console.log(`assigned shuffled_index: ${response.data.shuffled_index}`);
                this.setState({ shuffledIndex: response.data.shuffled_index });
            })
            .catch(error => {
                console.log('error assigning worker index:', error);
            });

        const getClasses = axios.get(`${API_URL}/db/get-classes`)
            .then(response => {
                let classes = response.data;
                classes.sort(() => Math.random() - 0.5);
                this.setState({ allClasses: classes });
            })
            .catch(error => {
                console.log(error);
            });

        Promise.all([assignIndex, getClasses]);
    }

    enableNextButton() {
        this.intro.current.enableNext();
    }

    disableNextButton() {
        this.intro.current.disableNext();
    }

    redirect() {
        this.exp.current.showPage();
    }

    render() {
        let invalidTag = {
            padding: '0 10px',
            height: '40px',
            margin: '10px',
            fontSize: '1em'
        }

        let consentPage = <Consent onCheck={this.enableNextButton} onUncheck={this.disableNextButton} />;

        let instruction = <Instruction><div>
            <p> Here's how the study will work: </p>
            <p> On each trial, you will see 24 detections of a specific category. Your goal is to label all invalid detections. Invalid detections include unrecognizable detections and detections of other categories.</p>
            <p> Example invalid detections of category <b>PENCIL</b>: </p>
            <Box display="flex">
                <Box flex={1} style={{ textAlign: 'center' }}>
                    <Chip label="Unrecognizable" style={invalidTag} />
                    <div className="image-box" style={{ margin: '0 auto' }}>
                        <img src={require('../../assets/img/red.png')} alt="red example" />
                    </div>
                </Box>
                <Box flex={1} style={{ textAlign: 'center' }}>
                    <Chip label="Detections of other Categories" style={invalidTag} />
                    <div className="image-box" style={{ margin: '0 auto' }}>
                        <img src={require('../../assets/img/chalk.png')} alt="other cat example 1" />
                    </div>
                </Box>
                <Box flex={1} style={{ textAlign: 'center' }}>
                    <Chip label="Detections of other Categories" style={invalidTag} />
                    <div className="image-box" style={{ margin: '0 auto' }}>
                        <img src={require('../../assets/img/brush.png')} alt="other cat example 2" />
                    </div>
                </Box>
            </Box>
            <p>When you finish, please click the submit button to complete the study.</p>
            <p>Let's try a practice trial!</p>
        </div></Instruction>;

        let samplePage = <Practice onChildUpdate={this.enableNextButton} />
        let pages = [consentPage, instruction, samplePage];

        return (
            <div>
                <Header title="Object detection validation study" />
                <Timeline ref={this.intro} pages={pages} showPage={true} finalText="Start the Study" redirect={this.redirect} />
                <Trial ref={this.exp} allClasses={this.state.allClasses} showPage={false} finalText="Finish" shuffledIndex={this.state.shuffledIndex} num={25} />
            </div>
        );
    }
}

class Consent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { checked: false };
    }

    handleCheck(e) {
        const checked = e.target.checked;
        this.setState({ checked });
        if (checked) {
            this.props.onCheck();
        } else {
            this.props.onUncheck();
        }
    }

    render() {
        return (
            <div style={{ padding: '30px', maxWidth: '800px', margin: 'auto', lineHeight: '1.6', fontSize: '18px' }}>
                <h2>Consent</h2>
                <p>By answering the following questions, you are participating in a study being performed by cognitive scientists
                in the University of California, San Diego Department of Psychology. If you have questions about this research, please contact Bria Long
                at brlong@ucsd.edu. If you are not satisfied with how this study is being conducted, or if you have any concerns,
                complaints, or general questions about the research or your rights as a participant, please contact the University of California, San Diego
                Institutional Review Board (IRB) to speak to someone independent of the research team at irb@ucsd.edu.
                Your participation in this research is voluntary. You may decline to answer any or all of the following questions.
                You may decline further participation, at any time, without adverse consequences. Your confidentiality is assured;
                the researchers who have requested your participation will not receive any personal information about you.</p>
                <p>Additionally, you agree to not redistribute any data from this study, and to not reidentify any participants within this study.</p>
                <label style={{ marginTop: '25px', gap: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={this.state.checked}
                        onChange={this.handleCheck.bind(this)}
                        style={{ transform: 'scale(2)', accentColor: '#444' }}
                    />
                    <span>&nbsp;&nbsp;I agree to participate</span>
                </label>
            </div>
        );
    }
}

class Practice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            invalid_count: 0,
            toRet: [],
            message: <p>Please identify all invalid detections of <b>TABLES</b></p>,
        }
        this.handleChildClick = this.handleChildClick.bind(this);
    }

    componentDidMount() {
        let fnames = Array.from({length:10}, (x,i) => i.toString() + '.jpg');
        let invalidF = Array.from({length:5}, (x,i) => "invalid" + i.toString() + ".png");
        fnames = fnames.concat(invalidF);
        fnames.sort(() => Math.random() - 0.5);
        let data = fnames.map((f, i) => {
            return { url: require('../../assets/example/' + f), valid: 0, _id: i, fname: f }
        });

        let toRet = data.map(curDraw => {
            let invalidMsg = '';
            let alertType = 'error';

            switch (curDraw.fname) {
                case 'invalid0.png':
                    invalidMsg = "Yes! Detections of irrelevant categories are invalid";
                    break;
                case 'invalid1.png':
                    invalidMsg = "Yes! Detections of irrelevant categories are invalid";
                    break;
                case 'invalid2.png':
                    invalidMsg = "Yes! Empty detections are invalid";
                    break;
                case 'invalid3.png':
                    invalidMsg = "Yes! Detections of irrelevant categories are invalid";
                    break;
                case 'invalid4.png':
                    invalidMsg = "Yes! Blurry and unrecognizable detections are invalid";
                    break;
                default:
                    invalidMsg = "This is a valid detection!";
                    alertType = 'warning';
            }

            return <InvalidCard
                input={curDraw}
                key={curDraw._id}
                local={true}
                invalidMsg={invalidMsg}
                hasAlert={true}
                alertType={alertType}
                handleAlertCard={this.handleChildClick} />;
        });

        this.setState({ toRet });
    }

    handleChildClick() {
        this.setState({ invalid_count: this.state.invalid_count + 1 });
    }

    componentDidUpdate() {
        if (this.state.invalid_count === 5) {
            this.setState({
                message: "You have found all invalid detections in this trial! Let's start the study!",
                invalid_count: -1
            });
            this.props.onChildUpdate();
        }
    }

    render() {
        return (
            <div>
                <h3 style={{ textAlign: "center", top: "30px" }}> {this.state.message} </h3>
                {this.state.toRet}
            </div>
        );
    }
}

export { Study };
