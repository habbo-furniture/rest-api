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

const collector = new gcp.cloudfunctionsv2.Function("rest-api-collector", {
  location: region,
  description: "Collects furniture information from pubsub queue",
  buildConfig: {
    runtime: "nodejs16",
    entryPoint: "collect",
    source: {
      storageSource: {
        bucket: collectorBucket.name,
        object: collectorArchive.name
      }
    }
  },
  serviceConfig: {
    maxInstanceCount: 3,
    minInstanceCount: 1,
    availableMemory: "256M",
    timeoutSeconds: 300,
    ingressSettings: "ALLOW_INTERNAL_ONLY",
    allTrafficOnLatestRevision: true,
  },
  eventTrigger: {
    triggerRegion: region,
    eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
    pubsubTopic: extractorStack.getOutput('pubsub').apply(output => output.id),
    retryPolicy: "RETRY_POLICY_RETRY",
  },
});


export { collector }
