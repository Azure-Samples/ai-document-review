import { BlobItem } from '@azure/storage-blob';
import { Button, Caption1, Card, CardHeader, CardPreview, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Divider, makeStyles, MessageBar, MessageBarBody, MessageBarTitle, ProgressBar, SkeletonItem, Text, tokens } from '@fluentui/react-components';
import { ArrowUploadRegular, MoreHorizontal20Regular } from '@fluentui/react-icons';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pdfIcon from '../../assets/pdf.svg';
import { listBlobs, uploadBlob } from '../../services/storage';
import PageHeader from '../../components/PageHeader';
import { DOCUMENTATION_URL } from '../../constants';

const flex = {
  gap: "16px",
  display: "flex",
};

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', width: '100vw' },
  uploadIcon: { fontSize: '72px', color: tokens.colorNeutralForeground3, margin: 'auto' },
  welcome: { margin: '16px', color: '#000', maxWidth: '800px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  heroImage: { margin: '16px', padding: '16px' },
  divider: { paddingTop: '10px', paddingBottom: '10px', maxWidth: '800px' },
  filesContainer: {
    ...flex,
    flexDirection: "column",
    maxWidth: "635px",
    margin: "16px",
    color: '#000'
  },

  row: {
    ...flex,
    flexWrap: "wrap",
  },

  card: {
    width: "200px",
    maxWidth: "100%",
    height: "260px",
  },

  caption: {
    color: tokens.colorNeutralForeground3,
  },

  smallRadius: { borderRadius: tokens.borderRadiusSmall },

  grayBackground: {
    backgroundColor: tokens.colorNeutralBackground3,
  },

  actions: {
    display: "flex",
  },
});

function Files() {
  const [fileList, setFileList] = useState<BlobItem[]>();
  const [blobError, setBlobError] = useState<string>();
  const [uploading, setUploading] = useState<boolean>(false);

  const classes = useStyles();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFileList() {
      try {
        const files = await listBlobs();
        setFileList(files);
      } catch (error: any) {
        setBlobError('Error loading files from storage: ' + error.message);
      }
    }

    loadFileList();
  }, []);

  const fileInput = useRef<HTMLInputElement | null>(null);

  const uploadFile = () => {
    if (fileInput && fileInput.current) {
      fileInput.current.click();
    }
  };

  const handleUploadFile = async (event: FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      const file = event.currentTarget.files[0];
      console.log(file);
      setUploading(true);
      
      try {
        await uploadBlob(file);
        openDocument(file.name);
      } catch (error: any) {
        setBlobError('Error uploading file to blob storage: ' + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const openDocument = useCallback((filename: string) =>
    navigate({ pathname: '/review', search: `?document=${filename}`}), [navigate]);

  return (
    <div className={classes.container}>
        <PageHeader
          title="Welcome to the AI Document Review accelerator"
          description="Upload a new document to get started, or select an existing document to pick up where you left off."
          customElement={<Button size="large" onClick={() => window.open(DOCUMENTATION_URL, "_blank")}>View documentation</Button>}
      />
      <Divider className={classes.divider}/>
      <div className={classes.filesContainer}>
        { 
          blobError && <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error loading files</MessageBarTitle>
              { blobError }
            </MessageBarBody>
          </MessageBar>
        }
        <div className={classes.row}>
          <input
            type="file"
            onChange={handleUploadFile}
            ref={fileInput}
            style={{display: 'none'}}
            accept="application/pdf"
          />
          <Card
            className={classes.card}
            appearance="filled-alternative"
            onClick={uploadFile}
          >
            <ArrowUploadRegular className={classes.uploadIcon} />
            <Text weight="semibold">Upload new document</Text>
          </Card>
          {
            !fileList && Array.from({length: 5},(_,i) => <SkeletonItem key={i} className={classes.card} />)
          }
          {
            fileList?.map((file) => (
              <Card
                key={file.name}
                className={classes.card}
                onClick={() => openDocument(file.name)}
              >
                <CardPreview
                  className={classes.grayBackground}
                >
                  <img
                    className={classes.smallRadius}
                    src={pdfIcon}
                    alt="Document Preview"
                  />
                </CardPreview>

                <CardHeader
                  header={<Text weight="semibold">{file.name}</Text>}
                  description={
                    <Caption1 className={classes.caption}>
                      Updated { file.properties?.lastModified.toLocaleDateString() }
                    </Caption1>
                  }
                  action={
                    <Button
                      appearance="transparent"
                      icon={<MoreHorizontal20Regular />}
                      aria-label="More actions"
                    />
                  }
                />
              </Card>
            ))
          }
          {
            fileList && fileList.length < 3 && Array.from({length: 5 - fileList.length}, (_,i) => 
              <Card key={i} className={classes.card} appearance='outline' />
            )
          }
        </div>
      </div>
      <Dialog open={uploading}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Uploading file</DialogTitle>
            <DialogContent>
              <ProgressBar />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default Files;
