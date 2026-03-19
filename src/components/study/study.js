import React from "react";
import { Layout, Tag, Alert } from "element-react";
import { InvalidCard } from "../SingleCard";
import { Header } from "../helper/header"
import "element-theme-default";
import axios from "axios";
import { Instruction, Timeline } from "./instruction";
import { Trial } from "./Trial";

const API_URL = process.env.REACT_APP_API_URL;

class Study extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            allClasses: [],
        };
        this.enableNextButton = this.enableNextButton.bind(this);
        this.redirect = this.redirect.bind(this);

        this.intro = React.createRef();
        this.exp = React.createRef();
    }

    componentDidMount() {
        axios.get(`${API_URL}/db/get-classes`)
            .then(response => {
                let classes = response.data;
                classes.sort(() => Math.random() - 0.5);
                this.setState({ allClasses: classes });
            })
            .catch((error) => {
                console.log(error);
            });
    }

    enableNextButton() {
        this.intro.current.enableNext();
    }

    redirect() {
        this.exp.current.showPage();
    }

    render() {
        let invalidTag = {
            padding: '0 10px',
            height: '40px',
            lineHeight: '40px',
            margin: '10px',
            fontSize: '1em'
        }

        let consent = <p>In this task, you will view some drawings made BY CHILDREN of various common objects,
            such as hats and lamps. Your task is to help us filter the dataset to identify off-task (i.e. "invalid") drawings.
            <br />
            Please keep in mind that even if a child's drawing is pretty sloppy and does not look pretty, it
            is still valid if it looks like the child who made it was at least trying to draw the object.
            <br />
            There are a few ways for a drawing to be considered "invalid," namely: (1) The drawing mainly
            consists of "scribbles"; (2) The canvas is almost entirely blank; (3) The drawing is recognizable, but it is a drawing of something else and it is clear
            the child was not trying to draw the target object;
            (4) The drawing contains any words, numbers, arrows, or other symbols that are not part of the object itself; please help us by
            flagging any inappropriate content as invalid.
            <br />
            <br />  PLEASE EXCLUDE AS FEW DRAWINGS AS POSSIBLE —– unrecognizable drawings are still VALID drawings.
            <br />
            <br />We expect this task to take approximately 7 minutes to complete, including the time it takes to read instructions.
            <br /> By answering the following questions, you are participating in a study being performed by cognitive scientists at UCSD.
            You must be at least 18 years old to participate. Your participation in this research is voluntary.
            You may decline to answer any or all of the following questions. You may decline further participation, at any time, without adverse consequences.
            Your anonymity is assured; the researchers who have requested your participation will not receive any personal information about you.
            <br />If you encounter a problem or error, send us an email and we will make sure you are compensated for your time! Please pay attention and
            do your best! Thank you!
            <br />Note: We recommend using Chrome. We have not tested this task in other browsers.
            </p>

        let instruction = <div>
            <p> Here's how the study will work: </p>
            <p> On each trial, you will see 24 drawings of a specific category. Your goal is to label all invalid drawings. Invalid drawings include random scribbles, word descriptions, drawings of irrelevant categories and blank drawings.</p>
            <p> Example invalid drawings of category <b>CATS</b>: </p>
            <Layout.Row>
                <Layout.Col span="8" style={{ textAlign: 'center' }}>
                    <Tag type="gray" style={invalidTag}>Random Scribbles</Tag>
                    <img className="invalid_img" src={require('../../assets/img/scribble.png')} alt="scribble example" />
                </Layout.Col>
                <Layout.Col span="8" style={{ textAlign: 'center' }}>
                    <Tag type="gray" style={invalidTag}>Word Descriptions</Tag>
                    <img className="invalid_img" src={require('../../assets/img/letter.png')} alt="letter example" />
                </Layout.Col>
                <Layout.Col span="8" style={{ textAlign: 'center' }}>
                    <Tag type="gray" style={invalidTag}>Drawings of Irrelevant Categories</Tag>
                    <img className="invalid_img" src={require('../../assets/img/lamp.png')} alt="lamp example" />
                </Layout.Col>
            </Layout.Row>
            <p>When you finish, please click the submit button to complete the study.</p>
            <p>Let's try a practice trial!</p>
        </div>;

        let consentPage = <Instruction>{consent}</Instruction>
        let instructionPage = <Instruction>{instruction}</Instruction>
        let samplePage = <Practice onChildUpdate={this.enableNextButton} />
        let pages = [consentPage, instructionPage, samplePage];

        return (
            <div>
                <Header title="Drawing Validation Study" />
                <Timeline ref={this.intro} pages={pages} showPage={true} finalText="Start the Study" redirect={this.redirect} />
                <Trial ref={this.exp} allClasses={this.state.allClasses} showPage={false} finalText="Finish" num={23} />
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
            message: <p>Please identify all invalid drawings of <b>CAMELS</b></p>,
        }
        this.handleChildClick = this.handleChildClick.bind(this);
    }

    componentDidMount() {
        let fnames = Array.from({length:19}, (x,i) => i.toString() + '.png');
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
                    invalidMsg = "Yes! Random scribbles are invalid";
                    break;
                case 'invalid1.png':
                    invalidMsg = "Yes! Word descriptions are invalid";
                    break;
                case 'invalid2.png':
                    invalidMsg = "Yes! Drawings of irrelevant categories are invalid";
                    break;
                case 'invalid3.png':
                    invalidMsg = "Yes! Drawings of irrelevant categories are invalid";
                    break;
                case 'invalid4.png':
                    invalidMsg = "Yes! Empty images are invalid";
                    break;
                default:
                    invalidMsg = "This is a valid drawing!";
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
                message: "You have found all invalid drawings in this trial! Let's start the study!",
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
