import { useState } from 'react';
import type { ToolType } from '../../types';
import { Sidebar } from './sidebar';
import { ToolContainer } from './tool-container';
import { Base64Tool } from '../tools/base64-tool';
import { JwtDecoderTool } from '../tools/jwt-decoder-tool';
import { UuidGeneratorTool } from '../tools/uuid-generator-tool';
import { JsonDiffTool } from '../tools/json-diff-tool';
import { HashGeneratorTool } from '../tools/hash-generator-tool';
import { UrlEncoderTool } from '../tools/url-encoder-tool';
import { TimestampConverterTool } from '../tools/timestamp-converter-tool';
import { RegexTesterTool } from '../tools/regex-tester-tool';
import { JsonFormatterTool } from '../tools/json-formatter-tool';
import { HttpRunnerTool } from '../tools/http-runner-tool';
import { EnvManagerTool } from '../tools/env-manager-tool';
import { JsonToTypescriptTool } from '../tools/json-to-typescript-tool';
import { MockGeneratorTool } from '../tools/mock-generator-tool';
import { ColorConverterTool } from '../tools/color-converter-tool';
import { MarkdownPreviewTool } from '../tools/markdown-preview-tool';
import { CurlConverterTool } from '../tools/curl-converter-tool';
import { SecretGeneratorTool } from '../tools/secret-generator-tool';
import styles from './layout.module.css';

export function Layout() {
  const [activeTool, setActiveTool] = useState<ToolType>('base64');

  const renderTool = () => {
    switch (activeTool) {
      case 'base64':
        return <Base64Tool />;
      case 'jwt-decoder':
        return <JwtDecoderTool />;
      case 'uuid-generator':
        return <UuidGeneratorTool />;
      case 'json-diff':
        return <JsonDiffTool />;
      case 'hash-generator':
        return <HashGeneratorTool />;
      case 'url-encoder':
        return <UrlEncoderTool />;
      case 'timestamp-converter':
        return <TimestampConverterTool />;
      case 'regex-tester':
        return <RegexTesterTool />;
      case 'json-formatter':
        return <JsonFormatterTool />;
      case 'http-runner':
        return <HttpRunnerTool />;
      case 'env-manager':
        return <EnvManagerTool />;
      case 'json-to-typescript':
        return <JsonToTypescriptTool />;
      case 'mock-generator':
        return <MockGeneratorTool />;
      case 'color-converter':
        return <ColorConverterTool />;
      case 'markdown-preview':
        return <MarkdownPreviewTool />;
      case 'curl-converter':
        return <CurlConverterTool />;
      case 'secret-generator':
        return <SecretGeneratorTool />;
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar activeTool={activeTool} onToolSelect={setActiveTool} />
      <main className={styles.content}>
        <ToolContainer tool={activeTool}>{renderTool()}</ToolContainer>
      </main>
    </div>
  );
}
