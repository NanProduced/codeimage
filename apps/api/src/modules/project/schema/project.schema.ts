import {Type} from '@sinclair/typebox';
import {enumLiteral} from '../../../common/typebox/enum.js';
import {Nullable} from '../../../common/typebox/nullable.js';

export const BaseProjectResponseSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    ownerId: Type.String({format: 'uuid'}),
  },
  {
    title: 'BaseProjectResponse',
  },
);

export const BaseSnippetEditorTabsSchema = Type.Array(
  Type.Object({
    id: Type.String({format: 'uuid'}),
    projectId: Type.String({format: 'uuid'}),
    code: Type.String(),
    languageId: Type.String(),
    tabName: Type.String(),
    lineNumberStart: Type.Integer({minimum: 1, maximum: 999_999}),
  }),
);

export const BaseSnippetFrameSchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  background: Type.String(),
  padding: Type.Number(),
  radius: Type.Number(),
  visible: Type.Boolean(),
  opacity: Type.Number(),
});

export const SnippetTerminalBorderType = enumLiteral(['glass'] as const);

export const UserWatermarkConfigSchema = Type.Object({
  enabled: Type.Boolean(),
  text: Type.String(),
  avatarUrl: Type.String(),
  position: Type.Union([
    Type.Literal('left'),
    Type.Literal('center'),
    Type.Literal('right'),
  ]),
  fontSize: Type.Number(),
  color: Type.String(),
  opacity: Type.Number(),
  showOnlyOnExport: Type.Boolean(),
});

export const BaseSnippetTerminalSchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  showHeader: Type.Boolean(),
  type: Type.String(),
  accentVisible: Type.Boolean(),
  shadow: Nullable(Type.String()),
  background: Type.String(),
  textColor: Type.String(),
  showWatermark: Type.Boolean(),
  showGlassReflection: Type.Boolean(),
  opacity: Type.Number(),
  alternativeTheme: Type.Boolean(),
  borderType: Nullable(SnippetTerminalBorderType),
  userWatermark: Nullable(UserWatermarkConfigSchema),
});

export const BaseSnippetEditorOptionsSchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  fontId: Type.String(),
  fontWeight: Type.Number(),
  showLineNumbers: Type.Boolean(),
  themeId: Type.String(),
  enableLigatures: Type.Boolean(),
});
