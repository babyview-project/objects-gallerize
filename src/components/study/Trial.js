import React from "react";
import { InvalidCard } from "../SingleCard";
import { Button, Box, Snackbar, Alert, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Prolific completion URL — update this when starting a new study
const PROLIFIC_COMPLETION_URL = `https://app.prolific.com/submissions/complete?cc=${process.env.REACT_APP_PROLIFIC_CODE}`;

const checkImages = {};

for (let i = 1; i <= 163; i++) {
  checkImages[i] = require(
    `../../assets/check/nonobject_tile_${String(i).padStart(4, '0')}.jpg`
  );
}

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
        this.previewJump = this.previewJump.bind(this);
        this.previewPrev = this.previewPrev.bind(this);
        this.previewNext = this.previewNext.bind(this);
        this.state = {
            showPage: props.showPage,
            buttonText: 'Next Category',
            classIdx: -1,
            toRet: [],
            nextDisable: false,
            invalidDrawings: [],
            curClass: '',
            checkList: checkImages,
            snackbarOpen: false,
            trialStart: null,
            // For preview: the shuffled_index currently being previewed
            previewShuffledIndex: props.previewIndex || 1,
        }
    }

    componentDidUpdate(prevProps) {
        if (
            this.props.previewClass &&
            prevProps.allClasses.length === 0 &&
            this.props.allClasses.length > 0
        ) {
            console.log(this.props.previewClass, this.props.allClasses);
            const classIdx = this.props.allClasses.indexOf(this.props.previewClass) - 1;
            if (classIdx !== -1) this.setState({ classIdx });
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

    // -----------------------------------------------------------------------
    // Preview-only navigation
    // -----------------------------------------------------------------------

    // Jump to an arbitrary class + shuffled_index (called from study.js search bar)
    previewJump(cls, shuffledIndex) {
        // Make sure Trial is visible
        if (!this.state.showPage) {
            this.setState({ showPage: true });
        }
        const classIdx = this.props.allClasses.indexOf(cls);
        // If class not found or not yet loaded, still try to fetch
        const effectiveIdx = classIdx !== -1 ? classIdx : this.state.classIdx;
        this.setState({
            classIdx: effectiveIdx,
            previewShuffledIndex: shuffledIndex,
            nextDisable: false,
            invalidDrawings: [],
        });
        this._fetchPreview(cls, shuffledIndex);
    }

    // Navigate to prev class in allClasses, same shuffled_index
    previewPrev() {
        const nextIdx = this.state.classIdx - 1;
        if (nextIdx < 0) return;
        const cls = this.props.allClasses[nextIdx];
        this.setState({ classIdx: nextIdx, nextDisable: false, invalidDrawings: [] });
        this._fetchPreview(cls, this.state.previewShuffledIndex);
    }

    // Navigate to next class in allClasses, same shuffled_index
    previewNext() {
        const nextIdx = this.state.classIdx + 1;
        if (nextIdx >= this.props.allClasses.length) return;
        const cls = this.props.allClasses[nextIdx];
        this.setState({ classIdx: nextIdx, nextDisable: false, invalidDrawings: [] });
        this._fetchPreview(cls, this.state.previewShuffledIndex);
    }

    // Internal fetch for preview — passes a fixed worker_id so server resolves the
    // correct shuffled_index assignment from WorkerIndex, but we override via
    // the previewShuffledIndex state by calling get-single-class directly.
    _fetchPreview(cls, shuffledIndex) {
        const filter = {
            class: cls,
            num: this.props.num,
            // Use a synthetic preview worker_id that encodes the index
            // (store.js already handles worker_ids starting with "preview")
            worker_id: `preview${shuffledIndex}`,
        };
        this.fetch(filter, /* isPreview */ true);
    }

    // -----------------------------------------------------------------------

    async nextPage() {
        if (this.state.nextDisable) {
            this.setState({ snackbarOpen: true });
            console.log(checkImages[this.state.checkFn]);
            // Skip POST in preview mode
            if (!this.props.isPreview) {
                let filename = checkImages[this.state.checkFn].split('/').slice(-1)[0];
                await axios.post(`${API_URL}/db/post-response`, [{
                    filename: filename,
                    class: this.state.curClass,
                    trial_type: 'attention_check',
                    shuffled_index: this.props.shuffledIndex,
                    reaction_time: Date.now() - this.state.trialStart,
                    worker_id: new URLSearchParams(window.location.search).get('PROLIFIC_PID') || 'preview',
                    order_index: this.state.classIdx + 1,
                }]);
            }
            return;
        }

        if (this.state.classIdx === this.props.allClasses.length - 1) {
            if (!this.props.isPreview) {
                window.location.href = PROLIFIC_COMPLETION_URL;
            }
            return;
        }

        if (this.state.classIdx === this.props.allClasses.length - 2) {
            this.setState({ buttonText: 'Submit' });
        }

        // Skip POST in preview mode
        if (!this.props.isPreview && this.state.invalidDrawings.length > 0) {
            const rt = Date.now() - this.state.trialStart;
            const drawings = this.state.invalidDrawings.map(d => ({ ...d, reaction_time: rt, trial_type: 'invalid_drawing', order_index: this.state.classIdx + 1 }));
            await axios.post(`${API_URL}/db/post-response`, drawings)
                .then(() => {
                    this.setState({ invalidDrawings: [] });
                })
                .catch(error => {
                    console.log(error);
                });
        } else {
            this.setState({ invalidDrawings: [] });
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

    fetch(filter, isPreviewFetch = false) {
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

                    // 1-indexed
                    let fn = Math.floor(Math.random() * Object.keys(this.state.checkList).length) + 1;
                    let checkData = { url: checkImages[fn], valid: 0, _id: this.state.classIdx, filename: fn, class: filter.class };
                    let checkCard = <InvalidCard
                        input={checkData}
                        key={checkData._id}
                        local={true}
                        hasCancel={true}
                        handleCheck={this.findCheck}
                        cancelCheck={this.cancelCheck} />;

                    toRet.push(checkCard);
                    toRet.sort(() => Math.random() - 0.5);

                    this.setState({ toRet, curClass: filter.class, trialStart: Date.now(), checkFn: fn });
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

        const { isPreview, allClasses } = this.props;
        const { classIdx, previewShuffledIndex } = this.state;

        // Preview arrow nav bar
        const previewNav = isPreview ? (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    margin: '8px auto',
                    width: 'fit-content',
                    fontSize: '0.85em',
                    color: '#856404',
                }}
            >
                <Tooltip title="Previous class">
                    <span>
                        <IconButton
                            size="small"
                            onClick={this.previewPrev}
                            disabled={classIdx <= 0}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <span style={{ fontWeight: 600 }}>
                    Preview — idx&nbsp;{previewShuffledIndex}
                    {classIdx >= 0 && allClasses[classIdx]
                        ? ` · ${allClasses[classIdx]}`
                        : ''}
                    &nbsp;({classIdx + 1}/{allClasses.length})
                </span>
                <Tooltip title="Next class">
                    <span>
                        <IconButton
                            size="small"
                            onClick={this.previewNext}
                            disabled={classIdx >= allClasses.length - 1}
                        >
                            <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        ) : null;

        return (
            <div style={{ display: this.state.showPage ? "block" : "none" }}>
                <div>
                    {previewNav}
                    <Box display="flex" justifyContent="center" alignItems="center" style={{ padding: '10px' }}>
                        <Button variant="contained" onClick={() => this.nextPage()}>{this.state.buttonText}</Button>
                        <div style={{ paddingLeft: '20px' }}> {this.state.classIdx + 1}/{this.props.allClasses.length} </div>
                    </Box>

                    <Box display="flex" justifyContent="center" alignItems="center" style={{ padding: '10px', textAlign: "center" }}>
                        <Box flex={1}><h3 style={{ textAlign: "center", top: "30px" }}><p>Please identify all invalid detections of <b>{this.props.allClasses[this.state.classIdx]}</b></p></h3></Box>
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
                        There are missing invalid detections. Please check again!
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}
