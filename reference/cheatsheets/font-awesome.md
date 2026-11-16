# Font Awesome — Pack·Family·Style 구분

> 웹 페이지에서 Font Awesome 아이콘을 고를 때 `pack`, `family`, `style`을 구분한다. 사용 중인 버전·라이선스에 따라 제공 아이콘과 굵기가 다르므로 실제 [아이콘 카탈로그](https://fontawesome.com/icons)에서 확인한다.

## 30초 선택법

| 필요한 것 | 먼저 볼 계열 | HTML 클래스 예 |
|---|---|---|
| 일반 UI 아이콘 | Classic Solid | `fa-solid fa-user` |
| 얇은 외곽선 UI | Classic Regular (해당 아이콘 제공 여부 확인) | `fa-regular fa-user` |
| 브랜드 로고 | Brands | `fa-brands fa-github` |
| Sharp 또는 Duotone 표현 | 해당 Family·라이선스 확인 | `fa-sharp fa-solid fa-user` |

먼저 사용하는 웹 폰트·SVG·Kit에 해당 아이콘과 스타일이 포함됐는지 확인한다. 스타일 이름이 있어도 **모든 아이콘이 모든 스타일로 제공되는 것은 아니다**.

## 계층

```text
Pack   → 여러 Family를 아우르는 시각적 묶음 (예: Jelly)
Family → 공통 디자인을 공유하는 Style 묶음 (예: Classic, Sharp, Duotone)
Style  → 구체적인 굵기·표현 (예: Solid, Regular, Light, Thin)
Icon   → 그 조합에서 선택하는 실제 아이콘 (예: user)
```

웹의 Classic family는 기본값이다. 따라서 `fa-solid fa-user`처럼 family 클래스를 생략해도 Classic Solid를 선택할 수 있다. 같은 이름의 아이콘이라도 `fa-sharp fa-solid fa-user`는 Sharp family의 Solid 스타일이다. 브랜드 로고는 `fa-brands`로 별도 선택한다.

```html
<!-- 사용 중인 Font Awesome 패키지/Kit이 로드돼 있어야 표시된다. -->
<i class="fa-solid fa-user" aria-hidden="true"></i>
<i class="fa-regular fa-user" aria-hidden="true"></i>
<i class="fa-brands fa-github" aria-hidden="true"></i>
<i class="fa-sharp fa-solid fa-user" aria-hidden="true"></i>
```

Light·Thin과 다양한 확장 family/pack은 계약 플랜과 버전에 따라 제공 범위가 달라진다. Pro/Pro+ 전용 제품군을 Free에 포함된 것처럼 가정하지 않는다. 아이콘을 화면 낭독기에서 의미 있게 읽혀야 한다면 장식용 `aria-hidden` 예시를 그대로 사용하지 말고 주변 텍스트나 접근 가능한 레이블을 제공한다.

## 선택할 때 묻는 질문

1. **의미:** 서비스 로고인가? 그렇다면 Brands. 일반 동작·상태인가? Solid/Regular부터 시작.
2. **스타일:** 채워진 모양과 외곽선 중 현재 UI의 대비·가독성에 맞는 것은?
3. **제공 범위:** 고른 아이콘·family·style 조합이 현재 설치 버전과 라이선스에 있는가?
4. **일관성:** 동일 화면의 아이콘에 불필요하게 여러 굵기·family를 섞지 않았는가?

[공식 Pack·Family·Style 설명](https://docs.fontawesome.com/web/dig-deeper/styles) · [HTML에 아이콘 추가](https://docs.fontawesome.com/web/add-icons/how-to).
