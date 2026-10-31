# 兼容性矩阵

> 由 `npm run build` 从 `plugins/*.yaml` 的 `compat` 字段生成。空单元格表示该条目不声明此维度，不表示不支持。

| 条目 | 类别 | DSH | Node | OS | 后端 | 依赖 |
|---|---|---|---|---|---|---|
| inference-serving | 推理服务 | >=0.2.0 <0.3.0 | >=20.11.0 | linux, macos | vllm | gpu, docker, network |
| inference-quantization | 量化 | >=0.2.0 <0.3.0 | >=20.11.0 | linux | vllm | gpu, docker, network |
| inference-tuning | 调优 | >=0.2.0 <0.3.0 | >=20 | linux | vllm | gpu, docker |
| inference-diagnose | 排障 | >=0.2.0 <0.3.0 | >=20 | linux | vllm | docker |
| training-sft | 训练 | >=0.2.0 <0.3.0 | >=20 | linux | transformers, peft, trl, accelerate | gpu, docker |
| training-rl | 训练 | >=0.2.0 <0.3.0 | >=20 | linux | transformers, trl, accelerate | gpu, docker |
| training-qat | 训练 | >=0.2.0 <0.3.0 | >=20 | linux | transformers, peft, accelerate | gpu, docker |
| training-pretrain | 训练 | >=0.2.0 <0.3.0 | >=20 | linux | transformers, accelerate | gpu, docker |
| ai-infra-core | 判定原语 | — | >=20 | linux, macos | — | — |

