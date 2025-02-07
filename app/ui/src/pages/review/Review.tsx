import { Button, Caption1, Card, CardHeader, CounterBadge, Divider, Field, MessageBar, MessageBarBody, MessageBarTitle, Skeleton, SkeletonItem, Spinner, Tag, TagPicker, TagPickerControl, TagPickerGroup, TagPickerInput, TagPickerList, TagPickerOnOptionSelectData, TagPickerOption, TagPickerProps, Toolbar, ToolbarButton, makeStyles } from '@fluentui/react-components';
import { ArrowCounterclockwiseFilled, CheckmarkFilled, ChevronDown16Regular, ChevronUp16Regular, Eye20Regular, EyeOff20Regular } from '@fluentui/react-icons';
import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useSearchParams } from 'react-router-dom';
import { IssueCard } from '../../components/IssueCard';
import { addAnnotation, deleteAnnotation, initAnnotations } from '../../services/annotations';
import { streamApi } from '../../services/api';
import { getBlob } from '../../services/storage';
import { AgentConfig } from '../../types/agent-config';
import { APIEvent } from '../../types/api-events';
import { Issue, IssueStatus } from '../../types/issue';

// https://github.com/wojtekmaj/react-pdf?tab=readme-ov-file#configure-pdfjs-worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const useStyles = makeStyles({
  content: { display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', height: '100%' },
  document: { display: 'flex', flexDirection: 'row', flexGrow: 1, justifyContent: 'center' },
  pdfViewer: { padding: '0px', minWidth: '500px', minHeight: '710px' },
  pdfToolbar: { display: 'flex', justifyContent: 'center', color: '#000', height: '27px' },
  loading: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  issues: { width: '350px', height: '710px', overflowY: 'scroll', padding: '10px', marginTop: '20px' },
  skeletonItem: { height: '100px', margin: '5px' },
  sidebar: {
    width: '300px',
    height: 'fit-content',
    margin: '20px',
    marginTop: '40px',
    padding: '10px',
    borderRadius: '10px',
    '& h4': { marginBottom: '5px' },
  },
  errorMsg: { overflow: 'scroll', maxHeight: '300px', wordWrap: 'break-word' },
  checkButton: { width: '100%', padding: '15px' },
  agentDescription: { width: '185px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }
});

function Review() {
  const [docId, setDocId] = useState<string>();
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfData, setPdfData] = useState<{ data: Uint8Array }>();
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string>();
  const [checkInProgress, setCheckInProgress] = useState<boolean>(false);
  const [checkComplete, setCheckComplete] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<string>();
  const [agentConfig] = useState<AgentConfig>({
    'Grammar & Spelling': {
      color: 'informative',
      description: 'Mispelling and grammatical issues including sentence structure'
    },
    'Definitive Language': {
      color: 'danger',
      description: 'Making statements of guarantee'
    }
  }); // TODO: get from DB
  const [issues, setIssues] = useState<Issue[]>([]);
  const [hideTypesFilter, sethideTypesFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(Object.values(IssueStatus));
  const [selectedIssue, setSelectedIssue] = useState<string>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedIssueAnnotationId, setSelectedIssueAnnotationId] = useState<string>();

  const abortControllerRef = useRef<AbortController>();

  const classes = useStyles();
  const [searchParams] = useSearchParams();

  const canRerun = import.meta.env.VITE_ALLOW_RERUN_CHECK! === 'true';

  const checkButtonIcon =
    checkInProgress
      ? <Spinner size="tiny" />
      : checkComplete
        ? canRerun
          ? <ArrowCounterclockwiseFilled />
          : <CheckmarkFilled />
        : undefined;
  
  const checkButtonContent =
    checkInProgress
      ? "Checking..."
      : checkComplete
        ? canRerun
          ? "Re-run check"
          : "Check complete"
        : "Run check";

  // Callback on PDF load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPdfLoaded(true);
  }

  // Update state to select an issue (by id) and apply a highlight annotation to PDF 
  function handleSelectIssue(issue: Issue) {
    // Remove existing highlight annotation
    setSelectedIssueAnnotationId(annotId => {
      if (annotId) {
        const pdfBytes = deleteAnnotation(annotId)
        setPdfData({ data: pdfBytes })
      }
      return undefined
    })

    setSelectedIssue(id => {
      if (id === issue.id) {
        return undefined
      } else {
        if (issue && issue.location?.page_num !== undefined) {
          // Navigate to page containing issue
          setPageNumber(issue.location.page_num)
          // Add extra annotation to highlight selected issue
          if (issue.location.bounding_box && issue.location.bounding_box.length > 0) {
            const [pdfBytes, annot] = addAnnotation(issue.location.page_num, issue.location.bounding_box, {
              r: 255,
              g: 0,
              b: 0
            })
            setSelectedIssueAnnotationId(annot.id)
            setPdfData({ data: pdfBytes })
          }
        }
        return issue.id
      }
    })
  }

  // Updates an issue within the issue list state
  function handleUpdateIssue(updatedIssue: Issue) {
    setIssues(issues => {
      const index = issues.findIndex(i => i.id === updatedIssue.id);
      if (index !== -1) {
        issues[index] = updatedIssue;
      }
      return [...issues];
    });
  }

  // Toggles the visibility of issue (agent) types.
  function toggleTypeVisibility(type: string) {
    sethideTypesFilter((types) => {
      if (types.includes(type)) {
        return types.filter((t) => t !== type);
      } else {
        return [...types, type];
      }
    })
  }

  // Filter by issue statuses
  function onStatusFilterSelect(
    _: Event | SyntheticEvent<Element, Event>,
    data: TagPickerOnOptionSelectData): TagPickerProps["onOptionSelect"] {
    if (data.value === "no-options") {
      return;
    }
    setStatusFilter(data.selectedOptions);
  };

  // Run check by opening stream with API and handling incoming events
  const runCheck = useCallback((rerun: boolean = false) => {
    if (docId) {
      let uri = `${docId}/issues`;
      if (rerun) {
        uri += '?rerun=true';
        setIssues([]);
        // TODO: clear annotations
      }
  
      setCheckInProgress(true);
      setCheckError(undefined);
      setCheckComplete(false);

      abortControllerRef.current = new AbortController();

      streamApi(
        uri,
        (msg) => {
          switch (msg.event) {
            case APIEvent.Issues: {
              const newIssues = JSON.parse(msg.data) as Issue[];
              setIssues(issues => [...issues, ...newIssues]);
              let pdfBytesWithAnnotations;

              for (const i of newIssues) {
                // If the issue has a bounding box, add an annotation to the PDF
                if (i.location && i.location.page_num !== undefined && i.location.bounding_box && i.location.bounding_box.length > 0) {
                  try {
                    [pdfBytesWithAnnotations] = addAnnotation(i.location.page_num, i.location.bounding_box)
                  } catch (e) {
                    console.error('Error adding annotation', e)
                  }
                }
              }
              if (pdfBytesWithAnnotations) {
                setPdfData({ data: pdfBytesWithAnnotations });
              }
              break;
            }
            case APIEvent.Error: {
              throw new Error(msg.data);
            }
            case APIEvent.Complete: {
              // If the API reports stream complete, abort connection on client side
              abortControllerRef.current!.abort();
              setCheckComplete(true);
              setCheckInProgress(false);
              break;
            }
            default: {
              throw new Error(`Unexpected event type: ${msg.event}`);
            }
          }
        }, (err) => {
          setCheckError(err.message);
          setCheckInProgress(false);
        },
        abortControllerRef.current
      );
    }
  }, [docId]);

  // Get document ID from URL param
  useEffect(() => {
    const docId = searchParams.get('document');
    if (docId) {
      setDocId(docId);
    } else {
      setPdfLoadError('No document specified in URL.');
    }
  }, [searchParams]);

  // Load PDF from blob storage
  useEffect(() => {
    async function loadPdf(docId: string) {
      try {
        const pdfBlob = await getBlob(docId);
        const pdfByteArray = new Uint8Array(await pdfBlob.arrayBuffer());
        // Initialise the annotation later
        const pdfBytesWithAnnot = initAnnotations(pdfByteArray);
        setPdfData({ data: pdfBytesWithAnnot });
      } catch (error) {
        let message = 'Error loading PDF from blob storage';
        if (error instanceof Error) {
          message += ': ' + error.message;
        }
        setPdfLoadError('Error loading PDF from blob storage: ' + message);
      }
    }

    if (docId) {
      loadPdf(docId);
    }
  }, [docId]);

  // Run check when document ID is set
  useEffect(() => {
    runCheck();

    return () => {
      // Abort the stream if component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [docId, runCheck]);

  return (
    <div className={classes.content}>
      <div className={classes.document}>
        <div>
          <Toolbar className={classes.pdfToolbar}>
          {
            pdfLoaded &&
              <>
                <ToolbarButton
                  aria-label="Previous page"
                  icon={<ChevronUp16Regular />}
                  onClick={() => setPageNumber(pageNumber - 1)}
                  disabled={pageNumber === 1}
                />
                  <small><b>{pageNumber}</b> / {numPages}</small>
                <ToolbarButton
                  aria-label="Next page"
                  icon={<ChevronDown16Regular />}
                  onClick={() => setPageNumber(pageNumber + 1)}
                  disabled={pageNumber === numPages}
                />
              </>
          }
          </Toolbar>
          <Card className={classes.pdfViewer}>
            {
              pdfLoadError && <MessageBar intent="error">
                <MessageBarBody>
                  <MessageBarTitle>Error loading document</MessageBarTitle>
                  { pdfLoadError }
                </MessageBarBody>
              </MessageBar>
            }
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Spinner className={classes.loading} />}
              noData={<Spinner className={classes.loading} />}>
              <Page pageNumber={pageNumber} width={500} loading={<Spinner className={classes.loading} />} />
            </Document>
          </Card>
        </div>
        {
          docId && <div className={classes.issues}>
            {
              issues
                // Apply status and type filters
                .filter((issue) => statusFilter.includes(issue.status) && !hideTypesFilter.includes(issue.type))
                // Sort by bounding box top to bottom
                .sort((a, b) => b.location.bounding_box[1] - a.location.bounding_box[1])
                // And in page order
                .sort((a, b) => a.location.page_num - b.location.page_num)
                .map((issue) => (
                  <IssueCard
                    key={issue.id}
                    docId={docId}
                    issue={issue}
                    selected={selectedIssue === issue.id}
                    onSelect={handleSelectIssue}
                    onUpdate={handleUpdateIssue}
                  />
                ))
            }
            {
              checkInProgress && <Skeleton>
                {
                  Array.from({length: 7}, (_,i) => <SkeletonItem key={i} className={classes.skeletonItem} />)
                }
              </Skeleton>
            }
          </div>
        }
      </div>
      <Card className={classes.sidebar}>
        {
          checkError && <MessageBar intent="error" className={classes.errorMsg}>
            <MessageBarBody>
              <MessageBarTitle>Error running check</MessageBarTitle>
                { checkError }
            </MessageBarBody>
          </MessageBar>
        }
        {
          docId && <Button
            className={classes.checkButton}
            disabledFocusable={checkInProgress || (checkComplete && !canRerun)}
            appearance='outline'
            icon={checkButtonIcon}
            size="large"
            onClick={() => runCheck(checkComplete)}
          >
            {checkButtonContent}
          </Button>
        }
        <Field aria-label="Filter by status" size="small">
          <TagPicker
            onOptionSelect={onStatusFilterSelect}
            selectedOptions={statusFilter}
          >
            <TagPickerControl>
              <TagPickerGroup aria-label="Show statuses">
                {statusFilter.map((option) => (
                  <Tag
                    key={option}
                    shape="rounded"
                    value={option}
                  >
                    {option.replace('_', ' ')}
                  </Tag>
                ))}
              </TagPickerGroup>
              <TagPickerInput aria-label="Filter by status" />
            </TagPickerControl>
            <TagPickerList>
              {
                Object.values(IssueStatus).map((option) => (
                  <TagPickerOption
                    value={option}
                    key={option}
                  >
                    {option.replace('_', ' ')}
                  </TagPickerOption>
                ))
              }
            </TagPickerList>
          </TagPicker>
        </Field>
        <div>
          <h4>Issue types</h4>
          <Divider />
        </div>
        {
          Object.entries(agentConfig).map((entry) => (
            <Card orientation="horizontal" appearance='subtle' key={entry[0]}>
              <CardHeader
                image={
                  <CounterBadge
                    count={issues.reduce((acc, cur) => (cur.type === entry[0] ? ++acc : acc), 0)}
                    size="large"
                    color={entry[1].color}
                    showZero
                  />
                }
                header={<b>{entry[0]}</b>}
                description={
                  <Caption1 className={classes.agentDescription}>{ entry[1].description }</Caption1>
                }
                action={
                  <Button
                    appearance="transparent"
                    icon={
                      hideTypesFilter.includes(entry[0]) ? <EyeOff20Regular /> : <Eye20Regular />
                    }
                    aria-label="More options"
                    onClick={() => toggleTypeVisibility(entry[0])}
                  />
                }
              />
            </Card>
          ))
        }
      </Card>
    </div>
  );
}

export default Review;
