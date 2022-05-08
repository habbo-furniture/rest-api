import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { location, region } from "../location";

const extractorStack: pulumi.StackReference = new pulumi.StackReference(`habbo/extractor/${pulumi.getStack()}`);

const collectorDirectory = __dirname + "/collector/";
const collectorBucket = new gcp.storage.Bucket("collector-bucket", { location });
const collectorArchive = new gcp.storage.BucketObject("collector-archive", {
  bucket: collectorBucket.name,
  source: new pulumi.asset.FileArchive(collectorDirectory),
});

const collector = new gcp.cloudfunctions.Function("rest-api-collector", {
  runtime: "nodejs16",
  entryPoint: "collector",
  sourceArchiveBucket: collectorArchive.bucket,
  sourceArchiveObject: collectorArchive.name,
  triggerHttp: true,
  region,
  ingressSettings: "ALLOW_INTERNAL_ONLY"
});

/*new gcp.pubsub.Subscription("collector-subscription", {
  topic: extractorStack.getOutput('pubsub').apply((topic: gcp.pubsub.Topic) => topic.urn),
  pushConfig: {
    pushEndpoint: collector.httpsTriggerUrl
  }
});*/


export { collector }
